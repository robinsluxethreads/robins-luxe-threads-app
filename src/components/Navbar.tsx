"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ADMIN_EMAILS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link
              href="/"
              className="text-xl font-bold"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#c9a84c",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              Robins Luxe Threads
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                user ? (
                  <>
                    <Link
                      href="/account"
                      className={`nav-link ${pathname === "/account" ? "active" : ""}`}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Account
                    </Link>
                    {ADMIN_EMAILS.includes(user.email || '') && (
                      <Link
                        href="/admin"
                        className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}
                        style={{ color: "#c9a84c", fontWeight: 600 }}
                      >
                        Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className={`nav-link ${pathname.startsWith("/auth") ? "active" : ""}`}
                  >
                    Login
                  </Link>
                )
              )}
              <Link
                href="/cart"
                className={`nav-link ${pathname === "/cart" ? "active" : ""}`}
                style={{ position: "relative", display: "flex", alignItems: "center" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -10,
                      background: "#c9a84c",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Hamburger */}
            <button
              className={`hamburger flex md:!hidden ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        {!loading && (
          user ? (
            <>
              <Link href="/account">Account</Link>
              {ADMIN_EMAILS.includes(user.email || '') && (
                <Link href="/admin" style={{ color: "#c9a84c", fontWeight: 600 }}>Admin</Link>
              )}
            </>
          ) : (
            <Link href="/auth/login">Login</Link>
          )
        )}
        <Link href="/cart" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Cart {cartCount > 0 && (
            <span
              style={{
                background: "#c9a84c",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 10,
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </>
  );
}
