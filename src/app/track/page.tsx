"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoreShell } from "@/components/store-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTrackedOrders } from "@/lib/orders.functions";
import { paise } from "@/lib/admin-data";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TrackOrder() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualId, setManualId] = useState("");

    useEffect(() => {
        async function fetchMemory() {
            try {
                const memory = JSON.parse(localStorage.getItem('veloiz_vault') || '[]');
                if (memory.length > 0) {
                    const data = await getTrackedOrders(memory);
                    setOrders(data);
                }
            } catch (e) { } finally {
                setLoading(false);
            }
        }
        fetchMemory();
    }, []);

    function handleManualSearch(e: React.FormEvent) {
        e.preventDefault();
        const id = manualId.trim().toUpperCase();
        if (!id.startsWith("VLZ-")) return toast.error("Invalid Order ID. Must start with VLZ-");
        router.push(`/order/${id}`);
    }

    return (
        <StoreShell>
            <section className="mx-auto max-w-[900px] px-5 py-16 md:px-10 md:py-24">
                <h1 className="font-display text-5xl leading-tight md:text-7xl">Your Orders</h1>

                <div className="mt-12 bg-paper border editorial-rule p-8 flex flex-col sm:flex-row gap-6 items-end justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Track manually</p>
                        <p className="text-sm text-ink-soft mt-2 max-w-sm">Look up an order made on another device by entering the ID from your email receipt.</p>
                    </div>
                    <form onSubmit={handleManualSearch} className="flex w-full sm:w-auto">
                        <Input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="VLZ-..." className="rounded-r-none h-12 bg-background border-editorial-rule shadow-none focus-visible:ring-0" />
                        <Button type="submit" variant="ink" className="rounded-l-none h-12 px-6"><Search className="h-4 w-4" /></Button>
                    </form>
                </div>

                <div className="mt-16">
                    <p className="text-xs uppercase tracking-[.16em] mb-6">Recent orders on this device</p>
                    {loading ? (
                        <p className="text-muted-foreground">Checking local vault...</p>
                    ) : orders.length === 0 ? (
                        <div className="py-12 text-muted-foreground">
                            <p>No recent orders found on this device.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {orders.map(order => (
                                <Link href={`/order/${order.order_number}`} key={order.order_number} className="group block border editorial-rule p-5 sm:p-6 bg-background hover:bg-paper transition">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <p className="font-display text-2xl">{order.order_number}</p>
                                            <p className="text-sm text-ink-soft mt-1">
                                                Placed {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-3">
                                                {order.order_items.map((i: any) => `${i.product_name} (${i.quantity})`).join(', ')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:items-end justify-between">
                                            <span className="px-3 py-1 bg-secondary text-xs uppercase tracking-widest rounded-full w-fit">
                                                {order.order_status}
                                            </span>
                                            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                                <span className="font-medium text-lg">{paise(order.total_paise)}</span>
                                                <Button variant="quiet" size="icon" className="group-hover:bg-ink group-hover:text-background transition-colors"><Eye className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </StoreShell>
    );
}
