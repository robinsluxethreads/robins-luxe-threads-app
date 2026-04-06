import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Robins Luxe Threads | Luxury Women's Clothing",
  description:
    "Discover curated luxury women's fashion at Robins Luxe Threads. Shop premium dresses, tops, bottoms, outerwear, and accessories with exclusive designs.",
  keywords: "luxury fashion, women's clothing, designer wear, premium fashion, Robins Luxe Threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body
        className="min-h-screen flex flex-col"
        style={{
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <AuthProvider>
          <CartProvider>
            <LayoutShell>{children}</LayoutShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
