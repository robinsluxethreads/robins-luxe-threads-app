"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

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
