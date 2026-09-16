"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDashboard, paise } from "@/lib/admin-data";

export default function Dashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchDashboard().then(setData).catch(console.error);
    }, []);

    const metrics = [
        { label: "Revenue (paid)", value: data ? paise(data.revenuePaise) : "—" },
        { label: "Orders", value: data?.orderCount ?? "—" },
        { label: "Pending orders", value: data?.pendingCount ?? "—" },
        { label: "Low stock lines", value: data?.lowStockCount ?? "—" },
        { label: "Products", value: data?.productCount ?? "—" },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl">Dashboard</h1>
            <div className="grid gap-px border editorial-rule bg-border sm:grid-cols-2 xl:grid-cols-5">
                {metrics.map((m) => (
                    <div key={m.label} className="bg-background p-5">
                        <p className="text-xs uppercase tracking-[.14em] text-muted-foreground">{m.label}</p>
                        <p className="mt-3 font-display text-4xl">{m.value}</p>
                    </div>
                ))}
            </div>

            <section className="border editorial-rule bg-background">
                <div className="flex items-center justify-between border-b editorial-rule px-5 py-4">
                    <h2 className="text-lg">Recent orders</h2>
                    <Link href="/admin/orders" className="text-sm text-primary">All orders</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-[.12em] text-muted-foreground">
                            <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr>
                        </thead>
                        <tbody>
                            {(data?.recent ?? []).map((order: any) => (
                                <tr key={order.id} className="border-t editorial-rule">
                                    <td className="px-5 py-3 font-medium">{order.order_number}</td>
                                    <td className="px-5 py-3">{order.customer_name}</td>
                                    <td className="px-5 py-3 capitalize">{order.payment_status}</td>
                                    <td className="px-5 py-3 capitalize">{order.order_status}</td>
                                    <td className="px-5 py-3 text-right">{paise(order.total_paise)}</td>
                                </tr>
                            ))}
                            {!data?.recent?.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No orders yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
