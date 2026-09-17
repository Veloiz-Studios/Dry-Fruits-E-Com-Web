"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreShell } from "@/components/store-shell";
import { useCart } from "@/components/cart-context";
import { money, priceFor } from "@/lib/catalog";
import { createOrder, verifyPayment } from "@/lib/orders.functions";
import { fetchSettings } from "@/lib/admin.actions";

// @ts-expect-error Types not provided by cashfree package
import { load } from '@cashfreepayments/cashfree-js';

function Field({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-xs uppercase tracking-[.14em] text-muted-foreground">{label}</Label>
            <Input id={id} type={type} value={value} onChange={onChange} required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none" />
        </div>
    );
}

export default function Checkout() {
    const cart = useCart();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [stage, setStage] = useState<"details" | "paying">("details");
    const [form, setForm] = useState({ customer_name: "", phone: "", email: "", line1: "", city: "", state: "", pincode: "" });

    // Dynamic Delivery Engine
    const [logistics, setLogistics] = useState({ fee: 99, threshold: 1500 });
    useEffect(() => {
        fetchSettings().then(s => {
            const notifs = s?.notifications as any;
            if (notifs) {
                setLogistics({
                    fee: (notifs.delivery_fee_paise ?? 9900) / 100,
                    threshold: (notifs.free_shipping_threshold_paise ?? 150000) / 100
                });
            }
        });
    }, []);

    const delivery = cart.subtotal >= logistics.threshold || cart.subtotal === 0 ? 0 : logistics.fee;
    const total = cart.subtotal + delivery;
    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((old) => ({ ...old, [key]: event.target.value }));

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!cart.items.length) return;
        setBusy(true);
        try {
            const order: any = await createOrder({
                data: {
                    customer_name: form.customer_name,
                    phone: form.phone,
                    email: form.email,
                    address: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode },
                    items: cart.items.map((item) => ({ slug: item.product.slug, weight: item.weight, quantity: item.quantity })),
                },
            });

            if (order.error) {
                toast.error(order.error);
                setStage("details");
                setBusy(false);
                return;
            }

            if (!order.paymentConfigured || !order.paymentSessionId) {
                toast.info("Order reserved. Online payment is not switched on yet.");
                setTimeout(() => cart.clear(), 100);
                router.push("/order/" + order.orderNumber);
                return;
            }

            setStage("paying");

            // Load Cashfree JS SDK strictly in sync with the backend session's environment
            const sdkMode = order.cashfreeEnvironment === "PRODUCTION" ? "production" : "sandbox";
            const cashfree = await load({
                mode: sdkMode,
            });

            // Hand over the payment session to Cashfree SDK for a robust full-page redirect
            cashfree.checkout({
                paymentSessionId: order.paymentSessionId,
                redirectTarget: "_self",
            });

            // Note: Cashfree automatically redirects to the return_url defined in the backend server action.
            setTimeout(() => cart.clear(), 500);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong.");
            setStage("details");
            setBusy(false);
        }
    }

    return (
        <StoreShell>
            <section className="mx-auto max-w-[1180px] px-5 py-14 md:px-10 md:py-20">
                <p className="text-xs uppercase tracking-[.2em]">Checkout</p>
                <h1 className="mt-4 text-5xl leading-[.9] md:text-7xl">Almost in your kitchen.</h1>

                {cart.items.length === 0 ? (
                    <div className="mt-16 border-y editorial-rule py-24 text-center">
                        <p className="font-display text-4xl">Your bag is empty.</p>
                        <Button asChild className="mt-6" variant="ink">
                            <Link href="/shop">Browse the pantry</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_400px]">
                        <form onSubmit={submit} className="space-y-10">
                            <fieldset className="space-y-5" disabled={busy}>
                                <legend className="mb-5 text-xs uppercase tracking-[.16em]">Your details</legend>
                                <Field id="customer_name" label="Full name" value={form.customer_name} onChange={set("customer_name")} />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field id="phone" label="Phone" value={form.phone} onChange={set("phone")} />
                                    <Field id="email" label="Email" type="email" value={form.email} onChange={set("email")} />
                                </div>
                            </fieldset>
                            <fieldset className="space-y-5" disabled={busy}>
                                <legend className="mb-5 text-xs uppercase tracking-[.16em]">Delivery address</legend>
                                <Field id="line1" label="Street address" value={form.line1} onChange={set("line1")} />
                                <div className="grid gap-5 sm:grid-cols-3">
                                    <Field id="city" label="City" value={form.city} onChange={set("city")} />
                                    <Field id="state" label="State" value={form.state} onChange={set("state")} />
                                    <Field id="pincode" label="PIN code" value={form.pincode} onChange={set("pincode")} />
                                </div>
                            </fieldset>
                            <Button type="submit" size="lg" variant="ink" className="h-14 w-full text-base" disabled={busy}>
                                {busy ? <><Loader2 className="animate-spin" /> {stage === "paying" ? "Processing payment securely" : "Reserving your order"}</> : `Pay ${money(total)}`}
                            </Button>
                            <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Payment is captured and verified on our server before your order is confirmed.</p>
                        </form>

                        <aside className="h-fit border editorial-rule bg-paper p-7">
                            <p className="text-xs uppercase tracking-[.16em]">Order summary</p>
                            <div className="mt-6 space-y-4 border-b editorial-rule pb-6">
                                {cart.items.map((item) => (
                                    <div key={`${item.product.id}-${item.weight}`} className="flex justify-between gap-4 text-sm">
                                        <span>{item.product.name} · {item.weight === 1000 ? "1kg" : `${item.weight}g`} × {item.quantity}</span>
                                        <span>{money(priceFor(item.product, item.weight) * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 border-b editorial-rule py-6 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
                                <div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "Complimentary" : money(delivery)}</span></div>
                            </div>
                            <div className="flex items-baseline justify-between pt-6 font-display text-3xl"><span>Total</span><span>{money(total)}</span></div>
                        </aside>
                    </div>
                )}
            </section>
        </StoreShell>
    );
}
