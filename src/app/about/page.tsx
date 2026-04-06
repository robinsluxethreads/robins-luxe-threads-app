import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Robins Luxe Threads",
  description:
    "Learn about Robins Luxe Threads — our story, values, and commitment to luxury women's fashion.",
};

const values = [
  {
    icon: "🌿",
    title: "Sustainability",
    desc: "We prioritize eco-friendly materials and ethical production practices to create fashion that's kind to the planet.",
  },
  {
    icon: "✨",
    title: "Quality",
    desc: "Every piece is crafted with meticulous attention to detail, using only premium fabrics and expert craftsmanship.",
  },
  {
    icon: "💜",
    title: "Inclusivity",
    desc: "Fashion is for everyone. We celebrate diversity with designs that empower women of all shapes and sizes.",
  },
  {
    icon: "💡",
    title: "Innovation",
    desc: "We blend timeless elegance with contemporary trends, bringing you designs that are both classic and modern.",
  },
];

const stats = [
  { number: "100+", label: "Happy Customers" },
  { number: "50+", label: "Unique Products" },
  { number: "5+", label: "Cities Served" },
  { number: "4.8", label: "Average Rating" },
];

export default function AboutPage() {
  return (
    <>
      {/* Banner */}
      <div className="page-banner">
        <h1
          className="gradient-text"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Our Story
        </h1>
        <div className="divider" />
      </div>

      {/* Who We Are */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-6 text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Who We Are
          </h2>
          <p className="mb-4 leading-relaxed" style={{ color: "#999" }}>
            Robins Luxe Threads was born from a passion for luxury fashion and a
            belief that every woman deserves to feel extraordinary. We curate the
            finest pieces from around the world, bringing together timeless
            elegance and contemporary style.
          </p>
          <p className="leading-relaxed" style={{ color: "#999" }}>
            Our journey began with a simple idea: make luxury fashion accessible
            without compromising on quality. Today, we serve women across India
            who appreciate the finer things in life — from statement dresses to
            everyday essentials, each piece in our collection is handpicked to
            elevate your wardrobe.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4" style={{ background: "#0d0d0d", overflow: "hidden" }}>
        <div className="max-w-7xl mx-auto px-2">
          <div className="section-heading">
            <h2>What We Stand For</h2>
            <div className="divider" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children" style={{ overflow: "hidden" }}>
            {values.map((v) => (
              <div key={v.title} className="value-card">
                <div className="icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-4 text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Ready to Explore?
        </h2>
        <p className="mb-8" style={{ color: "#888" }}>
          Discover our curated collection of luxury fashion.
        </p>
        <Link href="/shop" className="btn-gold">
          Shop Now
        </Link>
      </section>
    </>
  );
}
