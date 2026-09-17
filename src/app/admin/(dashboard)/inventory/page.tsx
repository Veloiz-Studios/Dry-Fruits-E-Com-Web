"use client";

import { useEffect, useState } from "react";
import { fetchProducts, updateVariantStock } from "@/lib/admin.actions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, Minus, Plus } from "lucide-react";

type UnifiedStockItem = {
    productId: string;
    productName: string;
    productSlug: string;
    isActive: boolean;
    variantId: string;
    weight: number;
    stock: number;
    threshold: number;
};

export default function AdminInventory() {
    const [items, setItems] = useState<UnifiedStockItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();

        const channel = supabase.channel('admin_inventory_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
                loadData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function loadData() {
        try {
            const rawProducts = await fetchProducts();
            const flatItems: UnifiedStockItem[] = [];

            rawProducts.forEach(p => {
                if (p.product_variants) {
                    p.product_variants.forEach((v: any) => {
                        flatItems.push({
                            productId: p.id,
                            productName: p.name,
                            productSlug: p.slug,
                            isActive: p.is_active,
                            variantId: v.id,
                            weight: v.weight_grams,
                            stock: v.stock_quantity,
                            threshold: v.low_stock_threshold
                        });
                    });
                }
            });

            // Sort so Low Stock items float to the top
            flatItems.sort((a, b) => {
                const aLow = a.stock <= a.threshold;
                const bLow = b.stock <= b.threshold;
                if (aLow && !bLow) return -1;
                if (!aLow && bLow) return 1;
                return a.productName.localeCompare(b.productName);
            });

            setItems(flatItems);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function adjustStock(variantId: string, diff: number) {
        // Optimistic UI bump
        setItems(items.map(item => item.variantId === variantId ? { ...item, stock: Math.max(0, item.stock + diff) } : item));
        try {
            await updateVariantStock(variantId, diff);
        } catch (e: any) {
            toast.error(e.message || "Failed to sync stock");
            loadData(); // Revert on failure
        }
    }

    if (loading) return <div className="p-8 text-muted-foreground">Loading ledger...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl">Warehouse Ledger</h1>

            <section className="border editorial-rule bg-background shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b editorial-rule text-left text-xs uppercase tracking-[.12em] text-muted-foreground bg-secondary/50">
                            <tr>
                                <th className="px-5 py-4 font-medium">SKU / Item</th>
                                <th className="px-5 py-4 font-medium text-center">Health</th>
                                <th className="px-5 py-4 font-medium text-center">Available Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.variantId} className={`border-b editorial-rule last:border-b-0 hover:bg-secondary/20 transition ${item.stock <= item.threshold ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-5 py-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <p className="font-display text-xl font-medium">{item.productName}</p>
                                            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm">
                                                {item.weight >= 1000 ? `${item.weight / 1000}kg` : `${item.weight}g`}
                                            </span>
                                            {!item.isActive && (
                                                <span className="text-[9px] uppercase tracking-widest font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm">Hidden</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center align-middle">
                                        {item.stock === 0 ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-destructive font-semibold">
                                                <AlertCircle className="w-4 h-4" /> Depleted
                                            </span>
                                        ) : item.stock <= item.threshold ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-orange-600 font-semibold">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-success font-semibold">
                                                Healthy
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center align-middle">
                                        <div className="flex items-center justify-center gap-4">
                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => adjustStock(item.variantId, -1)} disabled={item.stock === 0}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="font-mono text-xl w-12 text-center">{item.stock}</span>
                                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => adjustStock(item.variantId, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
