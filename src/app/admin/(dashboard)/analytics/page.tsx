"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { fetchAnalytics } from "@/lib/admin.actions";
import { money } from "@/lib/catalog";

export default function AnalyticsDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics().then(res => {
            setData(res);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="flex h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (!data) return <div className="p-8 text-center text-muted-foreground">No analytics available yet.</div>;

    return (
        <div className="space-y-8 pb-12">
            <h1 className="text-3xl font-display">Analytics Hub</h1>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border editorial-rule">
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Total Revenue</p>
                    <p className="text-4xl font-display">{money(data.totalRevenue)}</p>
                </div>
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Total Orders</p>
                    <p className="text-4xl font-display">{data.totalOrders}</p>
                </div>
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Average Order Value</p>
                    <p className="text-4xl font-display">{money(data.averageOrderValue)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 30-Day Revenue Trend */}
                <section className="xl:col-span-2 border editorial-rule bg-background shadow-soft p-6">
                    <h2 className="text-sm uppercase tracking-widest mb-8">Revenue Growth (Last 30 Days)</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                                <XAxis dataKey="date" tickFormatter={(str) => str.split('-')[2]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <Tooltip
                                    formatter={(value: any) => [money(Number(value) || 0), "Revenue"]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ borderRadius: '0px', border: '1px solid #1a1a1a', boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Top Selling Products */}
                <section className="border editorial-rule bg-background shadow-soft p-6">
                    <h2 className="text-sm uppercase tracking-widest mb-8">Top Movers</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E5E5" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12, fill: '#1a1a1a' }} />
                                <Tooltip
                                    formatter={(val: any) => [`${val} sold`, "Volume"]}
                                    contentStyle={{ borderRadius: '0', border: '1px solid #1a1a1a' }}
                                    cursor={{ fill: '#f4f4f5' }}
                                />
                                <Bar dataKey="sales" fill="#1a1a1a" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </div>
    );
}
