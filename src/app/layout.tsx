import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://veloiz.com'),
  title: {
    template: "%s | Veloiz",
    default: "Veloiz — Dry fruits, chosen properly",
  },
  description: "Premium dry fruits—Almonds, Walnuts, Dates, and Cashews—selected slowly, graded by hand, and packed fresh. Delivered directly to your door with intact character.",
  keywords: ["dry fruits", "premium nuts", "mamra almonds", "buy premium dates online", "fresh cashews", "farm fresh walnuts", "veloiz"],
  openGraph: {
    title: "Veloiz — Dry fruits, chosen properly",
    description: "Premium dry fruits selected slowly and packed fresh.",
    url: "https://veloiz.com",
    siteName: "Veloiz",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veloiz — Premium Dry Fruits",
    description: "Premium dry fruits grading the old-fashioned way.",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" />
      </head>
      <body>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
