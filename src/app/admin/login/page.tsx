"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { setAdminAuthCookie } from "@/lib/admin.actions";
import cover from "@/assets/veloiz-pistachios.jpg";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    async function submitLogin(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setBusy(false);
            return toast.error(error.message);
        }

        if (data?.session?.access_token) {
            try {
                await setAdminAuthCookie(data.session.access_token);
                router.push("/admin");
            } catch (err: any) {
                toast.error(err.message || "Failed to set session");
                setBusy(false);
            }
        } else {
            setBusy(false);
        }
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
            <div className="flex items-center px-6 py-16 md:px-16">
                <div className="w-full max-w-sm space-y-8">
                    <div>
                        <p className="font-display text-4xl font-semibold">VELOIZ</p>
                        <p className="mt-2 text-xs uppercase tracking-[.2em] text-muted-foreground">Trade desk</p>
                    </div>

                    <form onSubmit={submitLogin} className="space-y-8 animate-in fade-in duration-500">
                        <h1 className="text-4xl leading-[.95]">Sign in to run the shop.</h1>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Admin Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@veloiz.com" required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none text-xl md:text-2xl tracking-wider" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Password</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none text-xl md:text-2xl tracking-[.15em] font-sans" />
                            </div>
                        </div>

                        <Button type="submit" size="lg" variant="ink" className="h-13 w-full" disabled={busy}>
                            {busy ? <Loader2 className="animate-spin" /> : <>Access Dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground">Access is limited strictly to the owner account. 100% free structural login.</p>
                </div>
            </div>
            <div className="hidden lg:block relative bg-black">
                <img src={cover.src} alt="Veloiz pistachios" className="h-full w-full object-cover opacity-90" />
            </div>
        </div>
    );
}
