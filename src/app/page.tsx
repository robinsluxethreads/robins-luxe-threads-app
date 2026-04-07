export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import NewsletterForm from "@/components/NewsletterForm";

async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, emoji, gradient")
    .order("name");
  return (data as Category[]) || [];
}

async function getTrendingProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("id, name, price, old_price, category, emoji, images, badge, is_active, sizes, description")
    .eq("is_active", true)
    .limit(8);
  return (data as Product[]) || [];
}

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getTrendingProducts(),
  ]);

  const features = [
    { icon: "🚚", title: "Free Shipping", desc: "On orders above \u20B92,999" },
    { icon: "🔄", title: "Easy Returns", desc: "7-day return policy" },
    { icon: "🔒", title: "Secure Payment", desc: "100% secure checkout" },
    { icon: "💬", title: "24/7 Support", desc: "We're here to help" },
  ];

  return (
    <>
      {/* ====== HERO SECTION ====== */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="text-center px-4 relative z-10 fade-in">
          <p
            className="text-sm uppercase tracking-[4px] mb-4"
            style={{ color: "#c9a84c" }}
          >
            Luxury Women&apos;s Fashion
          </p>
          <h1
            className="gradient-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Robins Luxe Threads
          </h1>
          <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: "#999" }}>
            Discover curated luxury fashion that speaks to your elegance.
            Every piece tells a story of craftsmanship and style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-gold">
              Explore Collection
            </Link>
            <Link href="/about" className="btn-outline-gold">
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ====== SHOP BY CATEGORY ====== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="section-heading">
            <h2>Shop by Category</h2>
            <div className="divider" />
            <p>Find your perfect style from our curated collections</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                <div
                  className="category-card"
                  style={{
                    background: cat.gradient
                      ? `linear-gradient(135deg, ${cat.gradient}20, #1a1a1a)`
                      : "#1a1a1a",
                  }}
                >
                  <span className="text-4xl">{cat.emoji}</span>
                  <h3
                    className="text-base font-semibold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRENDING NOW ====== */}
      <section className="py-20 px-4" style={{ background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <div className="section-heading">
            <h2>Trending Now</h2>
            <div className="divider" />
            <p>The most popular picks from our collection</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/shop" className="btn-outline-gold">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3
                  className="text-sm font-semibold text-white mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-xs" style={{ color: "#888" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== NEWSLETTER ====== */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto newsletter-section p-8 sm:p-12 text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Stay in the Loop
          </h2>
          <p className="mb-6 text-sm" style={{ color: "#999" }}>
            Subscribe to get exclusive updates, new arrivals, and special offers
            delivered to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
