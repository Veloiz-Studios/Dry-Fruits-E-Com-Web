import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Track Your Order",
    description: "Track the status of your premium dry fruits order from Veloiz Studios.",
    robots: { index: false, follow: true },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
    return children;
}
