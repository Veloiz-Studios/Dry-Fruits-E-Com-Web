import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Pantry",
    description: "Browse our complete collection of premium, hand-graded dry fruits including Mamra almonds, walnuts, dates, and cashews.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return children;
}
