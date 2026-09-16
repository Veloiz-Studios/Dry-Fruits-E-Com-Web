"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import cover from "@/assets/veloiz-pistachios.jpg";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) return toast.error(error.message);
        router.push("/admin");
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
            <div className="flex items-center px-6 py-16 md:px-16">
                <form onSubmit={submit} className="w-full max-w-sm space-y-8">
                    <div>
                        <p className="font-display text-4xl font-semibold">VELOIZ</p>
                        <p className="mt-2 text-xs uppercase tracking-[.2em] text-muted-foreground">Trade desk</p>
                    </div>
                    <h1 className="text-4xl leading-[.95]">Sign in to run the shop.</h1>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none" />
                        </div>
                    </div>
                    <Button type="submit" size="lg" variant="ink" className="h-13 w-full" disabled={busy}>
                        {busy ? <Loader2 className="animate-spin" /> : "Sign in"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Access is limited to the owner account. There is no public sign up.</p>
                </form>
            </div>
            <div className="hidden lg:block">
                <img src={cover.src} alt="Veloiz pistachios" className="h-full w-full object-cover" />
            </div>
        </div>
    );
}
