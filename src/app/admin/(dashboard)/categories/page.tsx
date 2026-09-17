"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/image-uploader";
import { saveCategory, deleteCategory, fetchCategories } from "@/lib/admin.actions";

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState<any>(null);

    useEffect(() => {
        loadCategories();

        const channel = supabase.channel('admin_cat_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategories())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadCategories() {
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openEditor(cat?: any) {
        if (cat) {
            setForm({ ...cat });
        } else {
            setForm({
                name: "",
                slug: "",
                description: "",
                image_url: "",
                is_active: true,
                display_order: categories.length * 10
            });
        }
        setOpen(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await saveCategory(form);
            toast.success("Category saved successfully!");
            setOpen(false);
            loadCategories();
        } catch (error: any) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this category?")) return;
        setDeleting(true);
        try {
            await deleteCategory(id);
            toast.success("Category deleted permanently.");
            setOpen(false);
            loadCategories();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) return <div className="p-8 text-muted-foreground">Loading categories...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl">Categories</h1>
                <Button variant="ink" onClick={() => openEditor()}>
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
            </div>

            <section className="border editorial-rule bg-background shadow-soft">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b editorial-rule text-left text-xs uppercase tracking-[.12em] text-muted-foreground bg-secondary/50">
                            <tr>
                                <th className="px-5 py-4 font-medium">Category Structure</th>
                                <th className="px-5 py-4 font-medium uppercase text-center hidden md:table-cell">Products Assigned</th>
                                <th className="px-5 py-4 font-medium uppercase text-center">Status</th>
                                <th className="px-5 py-4 font-medium uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b editorial-rule last:border-b-0 hover:bg-secondary/20 transition duration-300">
                                    <td className="px-5 py-4 align-top">
                                        <div className="flex items-center gap-4">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} alt={cat.name} className="w-12 h-12 object-cover rounded border editorial-rule p-1 shrink-0 bg-background" />
                                            ) : (
                                                <div className="w-12 h-12 rounded border editorial-rule bg-secondary/30 shrink-0" />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-display text-xl font-medium">{cat.name}</p>
                                                    {!cat.is_active && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-yellow-200 shadow-sm">Hidden</span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-mono text-muted-foreground mt-1">/{cat.slug}</p>
                                                <p className="text-xs text-muted-foreground mt-2 max-w-sm">{cat.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center align-middle hidden md:table-cell">
                                        <span className="font-mono text-lg">{cat.products?.length || 0}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center align-middle">
                                        <span className={`px-3 py-1 text-xs rounded-full ${cat.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                                            {cat.is_active ? 'Visible' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right align-middle">
                                        <Button variant="quiet" size="sm" onClick={() => openEditor(cat)}>Manage</Button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center text-muted-foreground">
                                        <p className="font-display text-2xl">No categories found.</p>
                                        <p className="mt-2">Create structure for your catalog here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-xl w-full bg-paper border-l editorial-rule">
                    <SheetHeader className="mb-8">
                        <SheetTitle className="font-display text-3xl">{form?.id ? "Edit Category" : "New Category"}</SheetTitle>
                        <SheetDescription>Organize your storefront collections.</SheetDescription>
                    </SheetHeader>
                    {form && (
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category Name *</Label>
                                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="mt-2 h-12 bg-background border-editorial-rule shadow-none" placeholder="e.g. Exotic Nuts" />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">URL Slug *</Label>
                                        <Input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="mt-2 h-12 bg-background border-editorial-rule shadow-none font-mono text-sm" />
                                    </div>
                                    <div className="flex items-center justify-between border bg-background mt-6 px-4 h-12">
                                        <Label className="text-sm font-semibold uppercase tracking-widest">Visible on Store</Label>
                                        <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category Photo</Label>
                                    <div className="mt-2">
                                        <ImageUploader url={form.image_url} onChange={(val) => setForm({ ...form, image_url: val })} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-2 bg-background border-editorial-rule shadow-none min-h-[100px]" placeholder="A brief description for SEO and category headers." />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 mt-8 border-t editorial-rule">
                                {form.id ? (
                                    <Button type="button" variant="ghost" onClick={() => handleDelete(form.id)} disabled={deleting || saving} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                        {deleting ? "Deleting..." : "Delete category"}
                                    </Button>
                                ) : <div />}
                                <div className="flex gap-4">
                                    <Button type="button" variant="quiet" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="ink" disabled={saving || deleting}>{saving ? "Saving..." : "Save Category"}</Button>
                                </div>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
