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
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [busy, setBusy] = useState(false);

    async function submitPhone(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        // Supabase expects phone numbers in E.164 format (e.g. +91...)
        const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        setBusy(false);
        if (error) return toast.error(error.message);
        setStep("otp");
        toast.success("Security code sent!");
    }

    async function submitOtp(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
        const { data, error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });

        if (error) {
            setBusy(false);
            return toast.error(error.message);
        }

        if (data?.session?.access_token) {
            await setAdminAuthCookie(data.session.access_token);
        }

        setBusy(false);
        router.push("/admin");
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
            <div className="flex items-center px-6 py-16 md:px-16">
                <div className="w-full max-w-sm space-y-8">
                    <div>
                        <p className="font-display text-4xl font-semibold">VELOIZ</p>
                        <p className="mt-2 text-xs uppercase tracking-[.2em] text-muted-foreground">Trade desk</p>
                    </div>

                    {step === "phone" ? (
                        <form onSubmit={submitPhone} className="space-y-8">
                            <h1 className="text-4xl leading-[.95]">Sign in to run the shop.</h1>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Mobile Number</Label>
                                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9999999999" required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none text-xl tracking-wider" />
                            </div>
                            <Button type="submit" size="lg" variant="ink" className="h-13 w-full" disabled={busy}>
                                {busy ? <Loader2 className="animate-spin" /> : <>Send Code <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={submitOtp} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h1 className="text-4xl leading-[.95]">Verify your identity.</h1>
                            <p className="text-muted-foreground">We sent a 6-digit code to {phone}</p>
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="text-xs uppercase tracking-[.14em] text-muted-foreground">Security Code</Label>
                                <Input id="otp" type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required className="h-12 rounded-none border-0 border-b editorial-rule bg-transparent px-0 shadow-none text-2xl tracking-[.25em]" />
                            </div>
                            <Button type="submit" size="lg" variant="ink" className="h-13 w-full" disabled={busy}>
                                {busy ? <Loader2 className="animate-spin" /> : "Verify and Login"}
                            </Button>
                            <button type="button" onClick={() => setStep("phone")} className="text-xs text-muted-foreground underline block w-full text-center">Use a different number</button>
                        </form>
                    )}

                    <p className="text-xs text-muted-foreground">Access is limited to the owner account. There is no public sign up.</p>
                </div>
            </div>
            <div className="hidden lg:block">
                <img src={cover.src} alt="Veloiz pistachios" className="h-full w-full object-cover" />
            </div>
        </div>
    );
}
