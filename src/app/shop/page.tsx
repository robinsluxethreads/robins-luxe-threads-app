import { Suspense } from "react";
import type { Metadata } from "next";
import ShopContent from "@/components/ShopContent";

export const metadata: Metadata = {
  title: "Shop | Robins Luxe Threads",
  description:
    "Browse our curated collection of luxury women's fashion. Filter by category, price, and size.",
  openGraph: {
    title: "Shop | Robins Luxe Threads",
    description:
      "Browse our curated collection of luxury women's fashion. Filter by category, price, and size.",
    url: "https://robinsluxethreads.vercel.app/shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop | Robins Luxe Threads",
    description:
      "Browse our curated collection of luxury women's fashion at Robins Luxe Threads.",
  },
};

function ShopLoading() {
  return (
    <>
      <div className="page-banner">
        <h1 className="gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
          Our Collection
        </h1>
        <div className="divider" />
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ aspectRatio: "3/4" }} />
              <div className="p-4 space-y-2">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopContent />
    </Suspense>
  );
}
