"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Boxes, LayoutGrid, LogOut, Package, Settings, ShoppingCart, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminPhone } from "@/lib/orders.functions";

const NAV = [
    { to: "/admin", label: "Dashboard", icon: LayoutGrid },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [allowed, setAllowed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [debugContext, setDebugContext] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            setDebugContext(user);
            if (!user || !user.phone) {
                setIsLoading(false);
                return;
            }

            try {
                // Call secure server action to bypass any broken database RLS rules
                const isAllowed = await checkAdminPhone(user.phone);
                setAllowed(isAllowed);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        });
    }, []);

    async function signOut() {
        await supabase.auth.signOut();
        router.push("/admin/login");
    }

    if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Checking access…</div>;

    if (!allowed) {
        return (
            <div className="mx-auto max-w-md px-6 py-32 text-center">
                <h1 className="text-4xl">Not authorised</h1>
                <p className="mt-4 text-muted-foreground">This account is not on the Veloiz admin allow-list.</p>
                <div className="mt-6 p-4 bg-muted text-left text-xs font-mono overflow-auto rounded-md whitespace-pre-wrap word-break">
                    DEBUG INFO:
                    <br />Authenticated Phone: {debugContext?.phone ?? "No phone found on object"}
                    <br />User ID: {debugContext?.id}
                </div>
                <Button className="mt-6 w-full" variant="ink" onClick={signOut}>Sign out & Try Again</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[236px_1fr]">
            <aside className="border-b editorial-rule bg-background lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between px-5 py-5 lg:block">
                    <p className="font-display text-2xl font-semibold">VELOIZ</p>
                    <p className="hidden text-xs uppercase tracking-[.2em] text-muted-foreground lg:mt-1 lg:block">Trade desk</p>
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
                    {NAV.map(({ to, label, icon: Icon }) => {
                        const isActive = to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
                        return (
                            <Link
                                key={to}
                                href={to}
                                className={`flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm transition hover:bg-secondary ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                <Icon className="h-4 w-4" /> {label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div>
                <header className="flex items-center justify-between border-b editorial-rule bg-background px-5 py-4 md:px-8">
                    <p className="text-sm text-muted-foreground">Veloiz operations</p>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="quiet"><Link href="/">View storefront</Link></Button>
                        <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
                    </div>
                </header>
                <main className="px-5 py-8 md:px-8">{children}</main>
            </div>
        </div>
    );
}
