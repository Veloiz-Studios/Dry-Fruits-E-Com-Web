"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { Download, Loader2, TrendingUp, ShoppingBag, Banknote, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAnalytics } from "@/lib/admin.actions";
import { money } from "@/lib/catalog";

const PIE_COLORS = ["#1a1a1a", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#f5f5f5"];

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
                <h1 className="text-3xl font-display">Analytics</h1>
                <Button variant="outline" className="border-editorial-rule shadow-none bg-background shrink-0 font-medium" onClick={exportCsv}>
                    <Download className="w-4 h-4 mr-2" /> Export Orders CSV
                </Button>
            </div>

            {/* Masonry Layout Container */}
            <div className="columns-1 md:columns-2 xl:columns-3 gap-8 space-y-8">

                {/* Dashboard KPIs Container (Masonry Block 1) */}
                <div className="break-inside-avoid space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background border editorial-rule p-6 shadow-soft flex flex-col justify-between h-32 rounded-sm">
                            <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold"><Banknote className="w-3.5 h-3.5 mr-2" /> Sales</div>
                            <p className="text-3xl font-display font-medium tracking-tight text-ink">{money(data.totalRevenue)}</p>
                        </div>
                        <div className="bg-background border editorial-rule p-6 shadow-soft flex flex-col justify-between h-32 rounded-sm">
                            <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold"><ShoppingBag className="w-3.5 h-3.5 mr-2" /> Orders</div>
                            <p className="text-3xl font-display font-medium tracking-tight text-ink">{data.totalOrders}</p>
                        </div>
                        <div className="bg-background border editorial-rule p-6 shadow-soft flex flex-col justify-between h-32 rounded-sm">
                            <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold"><TrendingUp className="w-3.5 h-3.5 mr-2" /> A.O.V</div>
                            <p className="text-3xl font-display font-medium tracking-tight text-ink">{money(data.averageOrderValue)}</p>
                        </div>
                        <div className="bg-background border editorial-rule p-6 shadow-soft flex flex-col justify-between h-32 rounded-sm">
                            <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold"><Clock className="w-3.5 h-3.5 mr-2" /> Pending</div>
                            <p className="text-3xl font-display font-medium tracking-tight text-ink">{data.pendingOrders}</p>
                        </div>
                        <div className="bg-background border editorial-rule p-6 shadow-soft flex flex-col justify-between h-32 rounded-sm col-span-2">
                            <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold"><Package className="w-3.5 h-3.5 mr-2" /> Live Products</div>
                            <p className="text-3xl font-display font-medium tracking-tight text-ink">{data.activeProducts} SKUs mapped</p>
                        </div>
                    </div>
                </div>

                {/* 30-Day Revenue Trend (Masonry Block 2 - usually spans wide if we used grid, but in masonry it just fits a column) */}
                <section className="break-inside-avoid border editorial-rule bg-background shadow-soft p-6 lg:p-8 rounded-sm">
                    <h2 className="text-sm uppercase tracking-widest mb-8 font-semibold">Revenue Trend (30d)</h2>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                                <XAxis dataKey="date" tickFormatter={(str) => str.split('-')[2]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                                <Tooltip
                                    formatter={(value: any) => [money(Number(value) || 0), "Revenue"]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ borderRadius: '4px', border: '1px solid #1a1a1a', boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)', padding: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Sales By Category (Masonry Block 3) */}
                <section className="break-inside-avoid border editorial-rule bg-background shadow-soft p-6 lg:p-8 rounded-sm">
                    <h2 className="text-sm uppercase tracking-widest mb-6 font-semibold">Category Volume</h2>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                                    {data.salesByCategory?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val: any) => [`${val} packs`, "Volume"]}
                                    contentStyle={{ borderRadius: '4px', border: '1px solid #1a1a1a', padding: '10px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Top Selling Products (Masonry Block 4) */}
                <section className="break-inside-avoid border editorial-rule bg-background shadow-soft p-6 lg:p-8 rounded-sm">
                    <h2 className="text-sm uppercase tracking-widest mb-8 font-semibold">Top Movers (All-Time)</h2>
                    <div className="h-[240px] w-full flex flex-col justify-end">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E5E5" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 11, fill: '#1a1a1a' }} />
                                <Tooltip
                                    formatter={(val: any) => [`${val} units sold`, "Volume"]}
                                    contentStyle={{ borderRadius: '4px', border: '1px solid #1a1a1a', padding: '10px' }}
                                    cursor={{ fill: '#f4f4f5' }}
                                />
                                <Bar dataKey="sales" fill="#1a1a1a" radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

            </div>
        </div>
    );
}
