"use client";

import { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "@/lib/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";

export default function AdminSettings() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings()
            .then(setSettings)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleDeliveryChange = (key: string, value: number) => {
        setSettings({ ...settings, notifications: { ...(settings.notifications || {}), [key]: value * 100 } });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings(settings);
            toast.success("Settings saved successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-muted-foreground">Loading settings...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl">Store Profile</h1>
                <Button type="submit" variant="ink" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : "Save Configuration"}
                </Button>
            </div>

            <section className="border editorial-rule bg-background shadow-soft p-8">
                <h2 className="text-xs uppercase tracking-[.16em] text-muted-foreground mb-6">Business Identity</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Business Name</Label>
                            <Input value={settings?.business_name || ""} onChange={(e) => handleChange("business_name", e.target.value)} required className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Owner Name</Label>
                            <Input value={settings?.owner_name || ""} onChange={(e) => handleChange("owner_name", e.target.value)} className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs tracking-widest uppercase block mb-3">Store Logo</Label>
                        <ImageUploader url={settings?.logo_url || ""} onChange={(val) => handleChange("logo_url", val)} />
                    </div>
                </div>
            </section>

            <section className="border editorial-rule bg-background shadow-soft p-8">
                <h2 className="text-xs uppercase tracking-[.16em] text-muted-foreground mb-6">Public Contact & Receipts</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Support Phone</Label>
                            <Input value={settings?.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} type="tel" className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Support Email</Label>
                            <Input value={settings?.email || ""} onChange={(e) => handleChange("email", e.target.value)} type="email" className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs tracking-widest uppercase">Registered Address</Label>
                        <Textarea value={settings?.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="min-h-[80px] border-editorial-rule shadow-none bg-secondary/20" placeholder="HQ Address shown on invoices" />
                    </div>
                </div>
            </section>

            <section className="border editorial-rule bg-background shadow-soft p-8">
                <h2 className="text-xs uppercase tracking-[.16em] text-muted-foreground mb-6">Operations & Logistics</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Opening Time</Label>
                            <Input value={settings?.opening_time || ""} onChange={(e) => handleChange("opening_time", e.target.value)} type="time" required className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase">Closing Time</Label>
                            <Input value={settings?.closing_time || ""} onChange={(e) => handleChange("closing_time", e.target.value)} type="time" required className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t editorial-rule pt-6">
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase text-ink">Flat Delivery Fee (₹)</Label>
                            <Input type="number" min="0" value={settings?.notifications?.delivery_fee_paise !== undefined ? settings.notifications.delivery_fee_paise / 100 : 99} onChange={(e) => handleDeliveryChange("delivery_fee_paise", parseInt(e.target.value) || 0)} required className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                            <p className="text-xs text-muted-foreground w-11/12 mt-1">Default flat rate applied to standard orders.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-widest uppercase text-ink">Free Delivery Threshold (₹)</Label>
                            <Input type="number" min="0" value={settings?.notifications?.free_shipping_threshold_paise !== undefined ? settings.notifications.free_shipping_threshold_paise / 100 : 1500} onChange={(e) => handleDeliveryChange("free_shipping_threshold_paise", parseInt(e.target.value) || 0)} required className="h-12 border-editorial-rule shadow-none bg-secondary/20" />
                            <p className="text-xs text-muted-foreground w-11/12 mt-1">If cart subtotal hits this amount, shipping becomes FREE.</p>
                        </div>
                    </div>
                </div>
            </section>
        </form>
    );
}
