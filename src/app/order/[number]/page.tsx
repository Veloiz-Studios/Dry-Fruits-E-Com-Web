"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreShell } from "@/components/store-shell";
import { getOrderByNumber, verifyPayment } from "@/lib/orders.functions";
import { ORDER_PIPELINE, paise, weightLabel } from "@/lib/admin-data";
import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Confirmation({ params }: { params: Promise<{ number: string }> }) {
    const resolvedParams = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const number = resolvedParams.number;

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            try {
                if (searchParams.get("verify") === "true") {
                    await verifyPayment({ orderNumber: number });
                    router.replace(`/order/${number}`); // Clean URL
                }
            } catch (err) {
                console.error("Payment verification failed:", err);
            } finally {
                getOrderByNumber({ data: { orderNumber: number } })
                    .then(setData)
                    .catch(console.error)
                    .finally(() => setIsLoading(false));
            }
        }
        fetchOrder();
    }, [number, searchParams, router]);

    return (
        <StoreShell>
            <section className="mx-auto max-w-[1000px] px-5 py-16 md:px-10 md:py-24">
                {isLoading ? (
                    <p className="text-muted-foreground">Loading your order…</p>
                ) : !data ? (
                    <div className="border-y editorial-rule py-24 text-center">
                        <p className="font-display text-4xl">We could not find that order.</p>
                        <Button asChild className="mt-6" variant="ink"><Link href="/shop">Back to the pantry</Link></Button>
                    </div>
                ) : (
                    <>
                        <p className="text-xs uppercase tracking-[.2em]">Order {data.order_number}</p>
                        <h1 className="mt-4 text-5xl leading-[.9] md:text-7xl">Thank you, {data.customer_name.split(" ")[0]}.</h1>
                        <p className="mt-6 max-w-lg text-lg text-ink-soft">
                            {data.payment_status === "paid"
                                ? "Payment received. We are packing your order this week."
                                : "Your order is reserved. It will be confirmed as soon as payment is completed."}
                        </p>

                        <ol className="mt-14 grid gap-px border editorial-rule bg-border sm:grid-cols-5">
                            {ORDER_PIPELINE.map((stage, index) => {
                                const current = ORDER_PIPELINE.indexOf(data.order_status as (typeof ORDER_PIPELINE)[number]);
                                const done = index <= current;
                                return (
                                    <li key={stage} className={`bg-background p-5 ${done ? "" : "opacity-45"}`}>
                                        <span className={`flex h-7 w-7 items-center justify-center rounded-full border editorial-rule ${done ? "bg-primary text-primary-foreground" : ""}`}>
                                            {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                                        </span>
                                        <span className="mt-4 block text-sm capitalize">{stage}</span>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="mt-14 grid gap-12 md:grid-cols-[1fr_320px]">
                            <div>
                                <p className="mb-5 text-xs uppercase tracking-[.16em]">Items</p>
                                <div className="border-t editorial-rule">
                                    {data.order_items.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between border-b editorial-rule py-4 text-sm">
                                            <span>{item.product_name} · {weightLabel(item.weight_grams)} × {item.quantity}</span>
                                            <span>{paise(item.unit_price_paise * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{paise(data.subtotal_paise)}</span></div>
                                    <div className="flex justify-between"><span>Delivery</span><span>{data.delivery_paise === 0 ? "Complimentary" : paise(data.delivery_paise)}</span></div>
                                    <div className="flex items-baseline justify-between pt-3 font-display text-3xl"><span>Total</span><span>{paise(data.total_paise)}</span></div>
                                </div>
                            </div>
                            <div className="bg-paper p-6">
                                <p className="text-xs uppercase tracking-[.16em]">Delivering to</p>
                                <address className="mt-4 not-italic leading-7 text-ink-soft">
                                    {data.customer_name}<br />
                                    {(data.address as { line1: string }).line1}<br />
                                    {(data.address as { city: string }).city}, {(data.address as { state: string }).state} {(data.address as { pincode: string }).pincode}<br />
                                    {data.phone}
                                </address>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </StoreShell>
    );
}
