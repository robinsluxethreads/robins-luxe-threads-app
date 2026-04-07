"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "👗" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "✉️" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "📧" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
  { href: "/admin/activity", label: "Activity Log", icon: "🕐" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

interface SearchResult {
  type: "product" | "order" | "customer";
  id: string;
  label: string;
  sub: string;
  href: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const [prodRes, orderRes, custRes] = await Promise.all([
        supabase.from("products").select("id, name, category").ilike("name", `%${q}%`).limit(5),
        supabase.from("orders").select("id, order_number, customer_name").or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%`).limit(5),
        supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
      ]);

      const results: SearchResult[] = [];
      (prodRes.data || []).forEach((p) => {
        results.push({
          type: "product",
          id: p.id,
          label: p.name,
          sub: p.category,
          href: `/admin/products`,
        });
      });
      (orderRes.data || []).forEach((o) => {
        results.push({
          type: "order",
          id: o.id,
          label: o.order_number,
          sub: o.customer_name,
          href: `/admin/orders`,
        });
      });
      (custRes.data || []).forEach((c) => {
        results.push({
          type: "customer",
          id: c.id,
          label: c.full_name || c.email,
          sub: c.email,
          href: `/admin/customers`,
        });
      });

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch]);

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    setUnreadCount(count || 0);
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const typeIcon: Record<string, string> = {
    product: "👗",
    order: "📦",
    customer: "👥",
  };

  return (
    <AdminGuard>
      <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 40,
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: 260,
            background: "#111",
            borderRight: "1px solid #2a2a2a",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            transform: sidebarOpen ? "translateX(0)" : undefined,
            transition: "transform 0.3s ease",
          }}
          className="admin-sidebar"
        >
          {/* Brand */}
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.25rem",
                  color: "#c9a84c",
                  margin: 0,
                }}
              >
                Admin Panel
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}>
                Robins Luxe Threads
              </p>
            </Link>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  textDecoration: "none",
                  color: isActive(item.href) ? "#c9a84c" : "#aaa",
                  background: isActive(item.href)
                    ? "rgba(201,168,76,0.1)"
                    : "transparent",
                  borderLeft: isActive(item.href)
                    ? "3px solid #c9a84c"
                    : "3px solid transparent",
                  fontSize: "0.9rem",
                  fontWeight: isActive(item.href) ? 600 : 400,
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.label === "Messages" && unreadCount > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 10,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Back to site */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2a2a2a" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#888",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              ← Back to Site
            </Link>
          </div>
        </aside>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
          className="admin-main"
        >
          {/* Top bar */}
          <header
            style={{
              height: 60,
              background: "#111",
              borderBottom: "1px solid #2a2a2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.5rem",
              position: "sticky",
              top: 0,
              zIndex: 30,
              gap: "1rem",
            }}
          >
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-hamburger"
              style={{
                display: "none",
                background: "none",
                border: "none",
                color: "#ededed",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: 4,
              }}
            >
              ☰
            </button>

            <div style={{ fontSize: "0.9rem", color: "#888" }}>
              Welcome,{" "}
              <span style={{ color: "#c9a84c", fontWeight: 600 }}>
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"}
              </span>
            </div>

            {/* Search button */}
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
              style={{
                padding: "0.4rem 0.9rem",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#666",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search...
              <span style={{ fontSize: "0.7rem", color: "#555", marginLeft: 4 }}>Cmd+K</span>
            </button>

            <button
              onClick={() => signOut()}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                color: "#aaa",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#c9a84c";
                e.currentTarget.style.color = "#c9a84c";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#2a2a2a";
                e.currentTarget.style.color = "#aaa";
              }}
            >
              Sign Out
            </button>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
            {children}
          </main>
        </div>

        {/* Search Modal */}
        {searchOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 200,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "10vh 1rem",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSearchOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }
            }}
          >
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                width: "100%",
                maxWidth: 520,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "1rem", borderBottom: "1px solid #2a2a2a" }}>
                <input
                  ref={searchInputRef}
                  placeholder="Search products, orders, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    background: "#111",
                    border: "1px solid #333",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontFamily: "'Poppins', sans-serif",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#333")}
                />
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {searchLoading ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                    Searching...
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                    No results found
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#666", fontSize: "0.85rem" }}>
                    Type to search...
                  </div>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={r.type + r.id}
                      onClick={() => {
                        router.push(r.href);
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid #1f1f1f",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#222")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "1.2rem" }}>{typeIcon[r.type] || "📄"}</span>
                      <div>
                        <div style={{ color: "#ededed", fontSize: "0.85rem", fontWeight: 500 }}>
                          {r.label}
                        </div>
                        <div style={{ color: "#888", fontSize: "0.75rem" }}>
                          {r.sub} - {r.type}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <style>{`
          .admin-sidebar {
            transform: translateX(0);
          }
          @media (max-width: 768px) {
            .admin-sidebar {
              transform: translateX(-100%);
            }
            .admin-main {
              margin-left: 0 !important;
            }
            .admin-hamburger {
              display: block !important;
            }
          }
          @media (min-width: 769px) {
            .admin-main {
              margin-left: 260px;
            }
            .admin-hamburger {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </AdminGuard>
  );
}
