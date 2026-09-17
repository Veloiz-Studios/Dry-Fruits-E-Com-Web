import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { Toaster } from "@/components/ui/sonner";

import { CustomCursor } from "@/components/custom-cursor";

export const metadata: Metadata = {
  title: "Veloiz — Dry fruits, chosen properly",
  description: "Premium dry fruits selected slowly and packed fresh.",
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
          <CustomCursor />
        </CartProvider>
      </body>
    </html>
  );
}
