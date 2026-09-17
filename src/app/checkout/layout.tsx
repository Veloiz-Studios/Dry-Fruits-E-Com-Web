import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Secure Checkout",
    description: "Securely checkout your Veloiz dry fruits order.",
    robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
