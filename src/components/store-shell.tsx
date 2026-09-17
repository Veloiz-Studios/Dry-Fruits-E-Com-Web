"use client";
import Link from "next/link";
import { Menu, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/components/cart-context";
import { money, priceFor } from "@/lib/catalog";

export function StoreHeader() { const cart = useCart(); return <header className="sticky top-0 z-40 border-b editorial-rule bg-background/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10"><Sheet><SheetTrigger asChild><Button className="md:hidden" size="icon" variant="ghost" aria-label="Open menu"><Menu /></Button></SheetTrigger><SheetContent side="left"><nav className="mt-12 flex flex-col gap-7 text-xl"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/track">Track Orders</Link><Link href="/admin">Admin</Link></nav></SheetContent></Sheet><Link href="/" className="font-display text-4xl font-semibold">VELOIZ</Link><nav className="hidden items-center gap-8 text-sm md:flex"><Link href="/shop">Shop all</Link><Link href="/shop?category=Dates">Dates</Link><Link href="/shop?category=Almonds">Almonds</Link><Link href="/track">Track orders</Link><Link href="/admin">Trade desk</Link></nav><Sheet open={cart.open} onOpenChange={cart.setOpen}><SheetTrigger asChild><Button size="icon" variant="ghost" aria-label={`Cart with ${cart.count} items`}><ShoppingBag /><span className="absolute ml-6 -mt-6 min-w-5 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{cart.count}</span></Button></SheetTrigger><SheetContent className="flex w-full flex-col sm:max-w-lg"><SheetHeader><SheetTitle className="font-display text-4xl">Your provisions</SheetTitle><SheetDescription>Freshly packed, held for checkout.</SheetDescription></SheetHeader><div className="flex-1 space-y-5 overflow-y-auto py-8">{cart.items.length === 0 ? <div className="border-y editorial-rule py-16 text-center"><p className="font-display text-3xl">The bag is waiting.</p><Button asChild className="mt-5" variant="quiet"><Link href="/shop" onClick={() => cart.setOpen(false)}>Browse the pantry</Link></Button></div> : cart.items.map(x => <div key={`${x.product.id}-${x.weight}`} className="grid grid-cols-[80px_1fr_auto] gap-4 border-b editorial-rule pb-5"><img src={(x.product.image as any).src || x.product.image} alt={x.product.name} className="aspect-[4/5] w-20 object-cover" /><div><p className="font-display text-xl">{x.product.name}</p><p className="text-xs text-muted-foreground">{x.weight === 1000 ? "1kg" : `${x.weight}g`}</p><div className="mt-3 flex items-center gap-2"><Button size="icon" variant="quiet" className="h-7 w-7" onClick={() => cart.change(x.product.id, x.weight, x.quantity - 1)}><Minus /></Button><span>{x.quantity}</span><Button size="icon" variant="quiet" className="h-7 w-7" onClick={() => cart.change(x.product.id, x.weight, x.quantity + 1)}><Plus /></Button></div></div><div className="text-right"><p className="font-medium">{money(priceFor(x.product, x.weight) * x.quantity)}</p><Button size="icon" variant="ghost" aria-label="Remove item" onClick={() => cart.remove(x.product.id, x.weight)}><Trash2 /></Button></div></div>)}</div><div className="border-t editorial-rule pt-5"><div className="mb-5 flex justify-between font-display text-2xl"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div><Button asChild size="lg" variant="ink" className="h-14 w-full text-base"><Link href="/checkout" onClick={() => cart.setOpen(false)}>Proceed to checkout</Link></Button></div></SheetContent></Sheet></div></header> }
import { useEffect, useState } from "react";
import { fetchSettings } from "@/lib/admin.actions";

export function StoreFooter() {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetchSettings().then(setSettings).catch(() => null);
    }, []);

    return (
        <footer className="bg-accent text-accent-foreground mt-auto">
            <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-10">
                <div>
                    <p className="font-display text-5xl">{settings?.business_name || "VELOIZ"}</p>
                    <p className="mt-4 max-w-sm text-sm opacity-70">Dry fruits selected slowly, packed promptly, and sent while their character is intact.</p>
                </div>
                <div>
                    <p className="mb-4 text-xs uppercase tracking-widest opacity-60">Pantry</p>
                    <div className="space-y-2">
                        <Link href="/shop" className="block">Shop all</Link>
                        <Link href="/shop?category=Dates" className="block">Dates</Link>
                        <Link href="/shop?category=Nuts" className="block">Nuts</Link>
                    </div>
                </div>
                <div>
                    <p className="mb-4 text-xs uppercase tracking-widest opacity-60">Contact</p>
                    <p>{settings?.email || "hello@veloiz.com"}</p>
                    {settings?.phone && <p className="mt-2 opacity-70">Phone: {settings.phone}</p>}
                    {settings?.address && <p className="mt-2 opacity-70 whitespace-pre-line">{settings.address}</p>}
                    <p className="mt-6 text-xs opacity-50 uppercase tracking-widest">Store Hours:<br />{settings?.opening_time || '09:00'} - {settings?.closing_time || '19:00'}</p>
                </div>
            </div>
        </footer>
    );
}
export function StoreShell({ children }: { children: React.ReactNode }) { return <><StoreHeader /><main>{children}</main><StoreFooter /></> }