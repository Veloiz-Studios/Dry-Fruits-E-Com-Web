"use client";

import { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus } from "@/lib/admin.actions";
import { paise, ORDER_PIPELINE } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();

        // Realtime listener for incoming orders
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadOrders(); // Reload orders seamlessly immediately when a new order comes in
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadOrders() {
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Update order status instantly via secure server action
    async function updateStatus(id: string, newStatus: string) {
        try {
            await updateOrderStatus(id, newStatus);
            toast.success(`Order marked as ${newStatus}`);
            // Optimistically update the UI to prevent jarring visual lag before re-fetch happens
            setOrders(orders.map(o => o.id === id ? { ...o, order_status: newStatus } : o));
        } catch (err: any) {
            toast.error(err.message || 'Failed to update order status');
        }
    }

    if (loading) return <div className="p-8 text-muted-foreground">Loading orders...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl">Orders</h1>

            <section className="border editorial-rule bg-background shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b editorial-rule text-left text-xs uppercase tracking-[.12em] text-muted-foreground bg-secondary/50">
                            <tr>
                                <th className="px-5 py-4 font-medium">Order No.</th>
                                <th className="px-5 py-4 font-medium">Customer</th>
                                <th className="px-5 py-4 font-medium">Items</th>
                                <th className="px-5 py-4 font-medium">Total</th>
                                <th className="px-5 py-4 font-medium">Payment</th>
                                <th className="px-5 py-4 font-medium">Status & Workflow</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b editorial-rule last:border-b-0 hover:bg-secondary/20 transition duration-300">
                                    <td className="px-5 py-4 font-mono font-medium">{order.order_number}</td>
                                    <td className="px-5 py-4">
                                        <p>{order.customer_name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{order.phone}</p>
                                    </td>
                                    <td className="px-5 py-4 text-xs">
                                        {order.order_items?.map((i: any, idx: number) => (
                                            <div key={idx} className="mb-1 text-ink-soft">
                                                {i.product_name} ({i.quantity}x)
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">{paise(order.total_paise)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${order.payment_status === 'paid' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <select
                                            className={`h-8 border editorial-rule rounded-sm px-2 text-xs uppercase bg-transparent outline-none focus:border-primary transition cursor-pointer ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'text-primary border-primary' : ''}`}
                                            value={order.order_status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                        >
                                            {ORDER_PIPELINE.map(stage => (
                                                <option key={stage} value={stage}>{stage}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center text-muted-foreground">
                                        <p className="font-display text-2xl">No orders yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
