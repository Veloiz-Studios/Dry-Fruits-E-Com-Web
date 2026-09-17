"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { Download, Loader2, TrendingUp, ShoppingBag, Banknote, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAnalytics } from "@/lib/admin.actions";
import { money } from "@/lib/catalog";

// Vibrant, modern color palette for data visualization
const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

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

    if (loading) return <div className="flex h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (!data) return <div className="p-8 text-center text-muted-foreground">No analytics available yet.</div>;

    return (
        <div className="space-y-6 pb-16 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-ink">Intelligence Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time metrics and business analytics for Veloiz.</p>
                </div>
                <Button variant="outline" className="border shadow-sm bg-white hover:bg-gray-50 text-ink shrink-0 font-medium rounded-lg transition-all" onClick={exportCsv}>
                    <Download className="w-4 h-4 mr-2 text-indigo-500" /> Export CSV Report
                </Button>
            </div>

            {/* Premium KPI Cards (Bento Style Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Revenue Card */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <Banknote className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Banknote className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Sales</span>
                    </div>
                    <div>
                        <p className="text-4xl font-bold tracking-tight text-gray-900">{money(data.totalRevenue)}</p>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <ShoppingBag className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Orders</span>
                    </div>
                    <div>
                        <p className="text-4xl font-bold tracking-tight text-gray-900">{data.totalOrders}</p>
                    </div>
                </div>

                {/* AOV Card */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Average Order</span>
                    </div>
                    <div>
                        <p className="text-4xl font-bold tracking-tight text-gray-900">{money(data.averageOrderValue)}</p>
                    </div>
                </div>

                {/* Operations Block */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-600">Pending Fulfillment</span>
                        </div>
                        <span className="font-bold text-gray-900">{data.pendingOrders}</span>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-sm font-medium text-gray-600">Live SKUs</span>
                        </div>
                        <span className="font-bold text-gray-900">{data.activeProducts}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Graphs Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 30-Day Revenue Trend (Span 2) */}
                <section className="lg:col-span-2 bg-white border rounded-2xl shadow-sm p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-base font-bold text-gray-900">Revenue Growth Matrix</h2>
                        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">Last 30 Days</span>
                    </div>
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tickFormatter={(str) => str.split('-')[2]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} dy={10} />
                                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} />
                                <Tooltip
                                    formatter={(value: any) => [money(Number(value) || 0), "Revenue"]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <div className="space-y-6">
                    {/* Category Donut */}
                    <section className="bg-white border rounded-2xl shadow-sm p-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-6">Distribution by Category</h2>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none">
                                        {data.salesByCategory?.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => [`${val} packs`, "Volume"]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Top Selling Products */}
                    <section className="bg-white border rounded-2xl shadow-sm p-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-4">Top Movers (All-Time)</h2>
                        <div className="h-[200px] w-full flex flex-col justify-end">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 500 }} />
                                    <Tooltip
                                        formatter={(val: any) => [`${val} units sold`, "Volume"]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '10px' }}
                                        cursor={{ fill: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={16}>
                                        {data.topProducts?.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
