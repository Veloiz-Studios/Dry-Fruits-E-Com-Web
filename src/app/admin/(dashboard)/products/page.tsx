"use client";

import { useEffect, useState } from "react";
import { paise } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CopyPlus, Plus, Trash } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveProduct, deleteProduct, fetchProducts, fetchCategories } from "@/lib/admin.actions";

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Editor State
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState<any>(null);

    useEffect(() => {
        loadProducts();

        const channel = supabase.channel('admin_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => loadProducts())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadProducts() {
        try {
            const [prodData, catData] = await Promise.all([fetchProducts(), fetchCategories()]);
            setProducts(prodData);
            setCategories(catData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function seedDatabase() {
        setSeeding(true);
        try {
            const res = await fetch("/api/seed", { method: "POST" });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Database seeded successfully with dummy catalog!");
            loadProducts();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to seed");
        } finally {
            setSeeding(false);
        }
    }

    function openEditor(product?: any) {
        if (product) {
            setForm({
                ...product,
                variants: product.product_variants ? [...product.product_variants] : []
            });
        } else {
            const defaultCategoryId = categories.length > 0 ? categories[0].id : "";
            setForm({
                name: "", slug: "", short_description: "", long_description: "", is_active: true, category_id: defaultCategoryId,
                variants: [
                    { weight_grams: 250, price_paise: 0, stock_quantity: 0, low_stock_threshold: 5 },
                ]
            });
        }
        setOpen(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (form.variants.length === 0) {
            return toast.error("You must add at least one weight variant.");
        }
        setSaving(true);
        try {
            await saveProduct(form);
            toast.success("Product saved successfully!");
            setOpen(false);
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || "Failed to save product");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this product? This act is irreversible.")) return;
        setDeleting(true);
        try {
            await deleteProduct(id);
            toast.success("Product deleted permanently.");
            setOpen(false);
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) return <div className="p-8 text-muted-foreground">Loading products...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl">Products</h1>
                <div className="flex gap-4">
                    <Button variant="quiet" onClick={seedDatabase} disabled={seeding}>
                        <CopyPlus className="h-4 w-4 mr-2" /> Auto-Seed Default Catalog
                    </Button>
                    <Button variant="ink" onClick={() => openEditor()}>
                        <Plus className="h-4 w-4 mr-2" /> Add Product
                    </Button>
                </div>
            </div>

            <section className="border editorial-rule bg-background shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b editorial-rule text-left text-xs uppercase tracking-[.12em] text-muted-foreground bg-secondary/50">
                            <tr>
                                <th className="px-5 py-4 font-medium">Product</th>
                                <th className="px-5 py-4 font-medium hidden md:table-cell">Category</th>
                                <th className="px-5 py-4 font-medium">Variants & Pricing</th>
                                <th className="px-5 py-4 font-medium uppercase text-center hidden md:table-cell">Status</th>
                                <th className="px-5 py-4 font-medium uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b editorial-rule last:border-b-0 hover:bg-secondary/20 transition duration-300">
                                    <td className="px-5 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <p className="font-display text-xl font-medium">{product.name}</p>
                                            {!product.is_active && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-yellow-200 shadow-sm">Unpublished</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{product.short_description}</p>
                                        <span className={`md:hidden mt-3 inline-block px-2 py-0.5 text-[10px] rounded-full ${product.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                                            {product.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 align-top hidden md:table-cell">
                                        <span className="px-2 py-1 bg-secondary rounded-sm text-[10px] text-foreground uppercase tracking-widest">{product.categories?.name || 'General'}</span>
                                    </td>
                                    <td className="px-5 py-4 text-xs align-top">
                                        {product.product_variants?.map((v: any, idx: number) => (
                                            <div key={idx} className="mb-2 flex items-center justify-between gap-6 last:mb-0">
                                                <span className="font-mono text-muted-foreground w-8">{v.weight_grams === 1000 ? "1kg" : `${v.weight_grams}g`}</span>
                                                <span className="font-medium text-ink-soft w-16">{paise(v.price_paise)}</span>
                                                <span className={`px-2 py-0.5 rounded-full ${v.stock_quantity <= v.low_stock_threshold ? 'bg-destructive/10 text-destructive' : 'bg-primary/20 text-primary-foreground'}`}>
                                                    {v.stock_quantity} in stock
                                                </span>
                                            </div>
                                        ))}
                                        {(!product.product_variants || product.product_variants.length === 0) && <span className="text-muted-foreground">No variants set up.</span>}
                                    </td>
                                    <td className="px-5 py-4 text-center align-top hidden md:table-cell">
                                        <span className={`px-3 py-1 text-xs rounded-full ${product.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                                            {product.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right align-top">
                                        <Button variant="quiet" size="sm" onClick={() => openEditor(product)}>Edit</Button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-muted-foreground">
                                        <p className="font-display text-2xl">Your catalog is currently empty.</p>
                                        <p className="mt-2">Click Auto-Seed above to quickly insert the dummy data.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-2xl w-full bg-paper border-l editorial-rule">
                    <SheetHeader className="mb-8">
                        <SheetTitle className="font-display text-3xl">{form?.id ? "Edit Product" : "New Product"}</SheetTitle>
                        <SheetDescription>Update your catalog offerings in real-time.</SheetDescription>
                    </SheetHeader>
                    {form && (
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="space-y-4 border-b editorial-rule pb-8">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Product Name *</Label>
                                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="mt-2 h-12 bg-background border-editorial-rule shadow-none" placeholder="e.g. Mamra Almonds" />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">URL Slug *</Label>
                                    <Input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="mt-2 h-12 bg-background border-editorial-rule shadow-none font-mono text-sm" />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category *</Label>
                                        <Select value={form.category_id} onValueChange={(val) => setForm({ ...form, category_id: val })}>
                                            <SelectTrigger className="mt-2 h-12 bg-background border-editorial-rule shadow-none">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Short Summary</Label>
                                        <Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className="mt-2 h-12 bg-background border-editorial-rule shadow-none" placeholder="Catchy one liner" />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between border bg-background mt-4 px-4 h-12">
                                        <Label className="text-sm font-semibold uppercase tracking-widest">Published</Label>
                                        <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Extensive Description</Label>
                                    <Textarea value={form.long_description} onChange={e => setForm({ ...form, long_description: e.target.value })} className="mt-2 min-h-24 bg-background border-editorial-rule shadow-none" placeholder="Explain the origin, harvest, and flavor profile..." />
                                </div>
                            </div>

                            <div className="space-y-6 border-b editorial-rule pb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground block">Pricing & Inventory Matrix</Label>
                                    <Button type="button" variant="quiet" size="sm" onClick={() => setForm({ ...form, variants: [...form.variants, { weight_grams: 500, price_paise: 0, stock_quantity: 0, low_stock_threshold: 5 }] })}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Variant
                                    </Button>
                                </div>
                                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 pb-2 text-xs font-medium uppercase tracking-[.1em] text-muted-foreground border-b editorial-rule">
                                    <span>Gram Wt.</span>
                                    <span>Price (₹)</span>
                                    <span>Qty</span>
                                    <span>Alert At</span>
                                    <span className="w-10"></span>
                                </div>
                                {form.variants.map((v: any, index: number) => (
                                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                                        <div className="flex items-center gap-2">
                                            <Input type="number" required min={1} value={v.weight_grams} onChange={e => {
                                                const newV = [...form.variants];
                                                newV[index].weight_grams = parseInt(e.target.value || "0");
                                                setForm({ ...form, variants: newV });
                                            }} className="h-10 bg-background border-editorial-rule" />
                                            <span className="text-xs text-muted-foreground">g</span>
                                        </div>
                                        <Input type="number" required min={1} value={v.price_paise / 100} onChange={e => {
                                            const newV = [...form.variants];
                                            newV[index].price_paise = parseInt(e.target.value || "0") * 100;
                                            setForm({ ...form, variants: newV });
                                        }} className="h-10 bg-background border-editorial-rule text-right" />
                                        <Input type="number" required min={0} value={v.stock_quantity} onChange={e => {
                                            const newV = [...form.variants];
                                            newV[index].stock_quantity = parseInt(e.target.value || "0");
                                            setForm({ ...form, variants: newV });
                                        }} className="h-10 bg-background border-editorial-rule text-right" />
                                        <Input type="number" min={0} value={v.low_stock_threshold ?? 5} onChange={e => {
                                            const newV = [...form.variants];
                                            newV[index].low_stock_threshold = parseInt(e.target.value || "0");
                                            setForm({ ...form, variants: newV });
                                        }} className="h-10 bg-background border-editorial-rule text-right" />
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 shrink-0" onClick={() => {
                                            setForm({ ...form, variants: form.variants.filter((_: any, i: number) => i !== index) });
                                        }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {form.variants.length === 0 && (
                                    <p className="text-sm text-destructive uppercase tracking-widest text-center py-4 border border-destructive/20 border-dashed">You must add at least 1 variant</p>
                                )}
                            </div>
                            <div className="flex justify-between pt-4">
                                {form.id ? (
                                    <Button type="button" variant="ghost" onClick={() => handleDelete(form.id)} disabled={deleting || saving} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                        {deleting ? "Deleting..." : "Delete product"}
                                    </Button>
                                ) : <div />}
                                <div className="flex gap-4">
                                    <Button type="button" variant="quiet" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="ink" disabled={saving || deleting || form.variants.length === 0}>{saving ? "Saving..." : "Save Product"}</Button>
                                </div>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
