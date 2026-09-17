"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAnalytics } from "@/lib/admin.actions";
import { money } from "@/lib/catalog";

const PIE_COLORS = ["#1a1a1a", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5"];

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

    const exportCsv = () => {
        if (!data?.rawOrdersExport?.length) return;
        const keys = Object.keys(data.rawOrdersExport[0]);
        const csvRows = [
            keys.join(','),
            ...data.rawOrdersExport.map((row: any) => keys.map(k => `"${(row[k] || '').toString()}"`).join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Veloiz_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center text-muted-foreground"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (!data) return <div className="p-8 text-center text-muted-foreground">No analytics available yet.</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-display">Analytics Hub</h1>
                <Button variant="outline" className="border-editorial-rule shadow-none bg-background shrink-0" onClick={exportCsv}>
                    <Download className="w-4 h-4 mr-2" /> Export Orders Data
                </Button>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border editorial-rule">
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Total Revenue</p>
                    <p className="text-4xl font-display">{money(data.totalRevenue)}</p>
                </div>
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Total Orders</p>
                    <p className="text-4xl font-display">{data.totalOrders}</p>
                </div>
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Average Order</p>
                    <p className="text-4xl font-display">{money(data.averageOrderValue)}</p>
                </div>
                <div className="bg-background p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Items / Order</p>
                    <p className="text-4xl font-display">{data.avgItemsPerOrder.toFixed(1)}</p>
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

                <div className="space-y-8">
                    {/* Sales By Category */}
                    <section className="border editorial-rule bg-background shadow-soft p-6">
                        <h2 className="text-sm uppercase tracking-widest mb-6">Volume by Category</h2>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                                        {data.salesByCategory?.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => [`${val} pieces`, "Volume"]}
                                        contentStyle={{ borderRadius: '0', border: '1px solid #1a1a1a' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Top Selling Products */}
                    <section className="border editorial-rule bg-background shadow-soft p-6">
                        <h2 className="text-sm uppercase tracking-widest mb-8">Top Movers</h2>
                        <div className="h-[200px] w-full">
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
                                    <Bar dataKey="sales" fill="#1a1a1a" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
