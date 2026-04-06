"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/lib/utils";

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) || []));
  }, []);

  return (
    <footer className="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3
              className="text-xl font-bold mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#c9a84c",
              }}
            >
              Robins Luxe Threads
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#888" }}>
              Curating luxury fashion for the modern woman. Discover elegance
              in every thread, style in every stitch.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="Instagram">IG</a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="Facebook">FB</a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="share-btn" aria-label="X">X</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: "#c9a84c" }}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/shop">Shop</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: "#c9a84c" }}>Categories</h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?category=${cat.slug}`}>{cat.emoji} {cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: "#c9a84c" }}>Customer Care</h4>
            <ul className="space-y-2">
              <li><Link href="/contact">Help & Support</Link></li>
              <li><span style={{ color: "#888", fontSize: "0.9rem" }}>Shipping & Returns</span></li>
              <li><span style={{ color: "#888", fontSize: "0.9rem" }}>Size Guide</span></li>
              <li><span style={{ color: "#888", fontSize: "0.9rem" }}>Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center" style={{ borderColor: "#2a2a2a" }}>
          <p className="text-sm" style={{ color: "#555" }}>
            &copy; {new Date().getFullYear()} Robins Luxe Threads. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
