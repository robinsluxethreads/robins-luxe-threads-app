"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

interface DayData {
  label: string;
  revenue: number;
  orders: number;
}

interface CategoryCount {
  name: string;
  count: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface ActivityEntry {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  totalSubscribers: number;
  totalReviews: number;
  ordersToday: number;
  revenueToday: number;
  ordersYesterday: number;
  revenueYesterday: number;
}

// Animated number counter hook
function useCountUp(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const start = 0;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + (target - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return current;
}

function AnimatedStat({ value, prefix = "" }: { value: number; prefix?: string }) {
  const animated = useCountUp(value);
  return (
    <span>
      {prefix}
      {animated.toLocaleString("en-IN")}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const actionColors: Record<string, string> = {
  created: "#2ecc71",
  updated: "#3498db",
  deleted: "#e74c3c",
  status_changed: "#f39c12",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalSubscribers: 0,
    totalReviews: 0,
    ordersToday: 0,
    revenueToday: 0,
    ordersYesterday: 0,
    revenueYesterday: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const [
        { count: productCount },
        { count: orderCount },
        { data: orders },
        { count: customerCount },
        { count: pendingCount },
        { count: subscriberCount },
        { data: products },
        { count: reviewCount },
        { data: lowStockData },
        { data: activityData },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("order_status", "Placed"),
        supabase.from("subscribers").select("*", { count: "exact", head: true }),
        supabase.from("products").select("category"),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id, name, category, stock_quantity, low_stock_threshold")
          .or("stock_quantity.lte.low_stock_threshold,stock_quantity.eq.0")
          .order("stock_quantity", { ascending: true })
          .limit(20),
        supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const allOrders = orders || [];
      const totalRevenue = allOrders.reduce(
        (sum, o) => sum + (o.total || 0),
        0
      );

      // Today's stats
      const todayOrders = allOrders.filter(
        (o) => o.created_at?.split("T")[0] === todayStr
      );
      const yesterdayOrders = allOrders.filter(
        (o) => o.created_at?.split("T")[0] === yesterdayStr
      );

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue,
        totalCustomers: customerCount || 0,
        pendingOrders: pendingCount || 0,
        totalSubscribers: subscriberCount || 0,
        totalReviews: reviewCount || 0,
        ordersToday: todayOrders.length,
        revenueToday: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
        ordersYesterday: yesterdayOrders.length,
        revenueYesterday: yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0),
      });

      setRecentOrders(allOrders.slice(0, 10));

      // Filter low stock products properly (client side to be safe)
      const lowStock = (lowStockData || []).filter((p) => {
        const qty = p.stock_quantity ?? 100;
        const threshold = p.low_stock_threshold ?? 10;
        return qty <= threshold;
      });
      setLowStockProducts(lowStock);

      setRecentActivity(activityData || []);

      // Build last 7 days data
      const days: DayData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const label = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });

        const dayOrders = allOrders.filter(
          (o) => o.created_at?.split("T")[0] === dateStr
        );

        days.push({
          label,
          revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
          orders: dayOrders.length,
        });
      }
      setDailyData(days);

      // Build top 5 categories by product count
      const catMap: Record<string, number> = {};
      (products || []).forEach((p) => {
        const cat = p.category || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const sorted = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setCategoryData(sorted);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  function getTrendArrow(current: number, previous: number): { arrow: string; color: string } | null {
    if (previous === 0 && current === 0) return null;
    if (current > previous) return { arrow: "↑", color: "#2ecc71" };
    if (current < previous) return { arrow: "↓", color: "#e74c3c" };
    return { arrow: "→", color: "#888" };
  }

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: "👗", isPrice: false },
    { label: "Total Orders", value: stats.totalOrders, icon: "📦", isPrice: false },
    { label: "Total Revenue", value: stats.totalRevenue, icon: "💰", isPrice: true },
    { label: "Total Customers", value: stats.totalCustomers, icon: "👥", isPrice: false },
    { label: "Pending Orders", value: stats.pendingOrders, icon: "⏳", isPrice: false },
    { label: "Subscribers", value: stats.totalSubscribers, icon: "📧", isPrice: false },
    { label: "Reviews", value: stats.totalReviews, icon: "⭐", isPrice: false },
  ];

  const statusColor: Record<string, string> = {
    Placed: "#eab308",
    Confirmed: "#3b82f6",
    Shipped: "#8b5cf6",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
  };

  const paymentColor: Record<string, string> = {
    Paid: "#22c55e",
    Pending: "#eab308",
    COD: "#f97316",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #2a2a2a",
            borderTopColor: "#c9a84c",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...dailyData.map((d) => d.orders), 1);
  const maxCatCount = Math.max(...categoryData.map((c) => c.count), 1);

  const ordersTrend = getTrendArrow(stats.ordersToday, stats.ordersYesterday);
  const revenueTrend = getTrendArrow(stats.revenueToday, stats.revenueYesterday);

  return (
    <div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.75rem",
          color: "#ededed",
          marginBottom: "1.5rem",
        }}
      >
        Dashboard Overview
      </h1>

      {/* Today's Highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#c9a84c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Today{"'"}s Orders
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "#ededed" }}>
              {stats.ordersToday}
            </span>
            {ordersTrend && (
              <span style={{ color: ordersTrend.color, fontSize: "0.85rem", fontWeight: 600 }}>
                {ordersTrend.arrow} vs yesterday
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#c9a84c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Today{"'"}s Revenue
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "#ededed" }}>
              {formatCurrency(stats.revenueToday)}
            </span>
            {revenueTrend && (
              <span style={{ color: revenueTrend.color, fontSize: "0.85rem", fontWeight: 600 }}>
                {revenueTrend.arrow} vs yesterday
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link
          href="/admin/products"
          style={{
            padding: "0.5rem 1rem",
            background: "#c9a84c22",
            color: "#c9a84c",
            border: "1px solid #c9a84c44",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          + Add Product
        </Link>
        <Link
          href="/admin/orders"
          style={{
            padding: "0.5rem 1rem",
            background: "#3498db22",
            color: "#3498db",
            border: "1px solid #3498db44",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          View Orders
        </Link>
        <Link
          href="/admin/messages"
          style={{
            padding: "0.5rem 1rem",
            background: "#2ecc7122",
            color: "#2ecc71",
            border: "1px solid #2ecc7144",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Check Messages
        </Link>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: "1.25rem",
              transition: "border-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.borderColor = "#c9a84c")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.borderColor = "#2a2a2a")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{card.icon}</span>
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#c9a84c",
                marginBottom: 4,
              }}
            >
              <AnimatedStat
                value={card.value as number}
                prefix={card.isPrice ? "₹" : ""}
              />
            </div>
            <div style={{ fontSize: "0.8rem", color: "#888" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {/* Revenue Chart */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              color: "#ededed",
              margin: "0 0 1rem",
            }}
          >
            Revenue (Last 7 Days)
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 140,
            }}
          >
            {dailyData.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: "0.6rem", color: "#888" }}>
                  {d.revenue > 0 ? formatCurrency(d.revenue) : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 32,
                    background: "linear-gradient(180deg, #c9a84c, #b8942e)",
                    borderRadius: "4px 4px 0 0",
                    height: `${Math.max((d.revenue / maxRevenue) * 100, 3)}%`,
                    transition: "height 0.6s ease-out",
                    minHeight: 3,
                  }}
                />
                <span style={{ fontSize: "0.6rem", color: "#666" }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders per Day Chart */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              color: "#ededed",
              margin: "0 0 1rem",
            }}
          >
            Orders per Day (Last 7 Days)
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 140,
            }}
          >
            {dailyData.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: "0.65rem", color: "#888" }}>
                  {d.orders > 0 ? d.orders : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 32,
                    background: "linear-gradient(180deg, #c9a84c, #b8942e)",
                    borderRadius: "4px 4px 0 0",
                    height: `${Math.max((d.orders / maxOrders) * 100, 3)}%`,
                    transition: "height 0.6s ease-out",
                    minHeight: 3,
                  }}
                />
                <span style={{ fontSize: "0.6rem", color: "#666" }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories Chart */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              color: "#ededed",
              margin: "0 0 1rem",
            }}
          >
            Top Categories by Products
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryData.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.8rem" }}>No data</p>
            ) : (
              categoryData.map((cat, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{ color: "#ccc" }}>{cat.name}</span>
                    <span style={{ color: "#888" }}>{cat.count}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#111",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(cat.count / maxCatCount) * 100}%`,
                        background: "linear-gradient(90deg, #c9a84c, #d4b96a)",
                        borderRadius: 4,
                        transition: "width 0.6s ease-out",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #2a2a2a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                color: "#f39c12",
                margin: 0,
              }}
            >
              Low Stock Products
            </h2>
            <Link
              href="/admin/products"
              style={{ fontSize: "0.8rem", color: "#c9a84c", textDecoration: "none" }}
            >
              Manage Products →
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a", color: "#888", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Product Name</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Category</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Current Stock</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Threshold</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}></th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => {
                  const isOutOfStock = (p.stock_quantity ?? 0) === 0;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #1f1f1f",
                        background: isOutOfStock ? "rgba(231,76,60,0.05)" : "rgba(243,156,18,0.03)",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "#ededed", fontWeight: 500 }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: isOutOfStock ? "#e74c3c22" : "#f39c1222",
                            color: isOutOfStock ? "#e74c3c" : "#f39c12",
                          }}
                        >
                          {p.stock_quantity ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#888" }}>
                        {p.low_stock_threshold ?? 10}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <Link
                          href="/admin/products"
                          style={{
                            padding: "4px 10px",
                            background: "#c9a84c22",
                            color: "#c9a84c",
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity + Recent Orders side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Recent Activity Feed */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #2a2a2a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                color: "#ededed",
                margin: 0,
              }}
            >
              Recent Activity
            </h2>
            <Link
              href="/admin/activity"
              style={{ fontSize: "0.8rem", color: "#c9a84c", textDecoration: "none" }}
            >
              View All →
            </Link>
          </div>
          <div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                No activity recorded yet
              </div>
            ) : (
              recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid #1f1f1f",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: actionColors[entry.action] || "#888",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", color: "#ccc" }}>
                      <span style={{ color: actionColors[entry.action] || "#888", fontWeight: 600, textTransform: "capitalize" }}>
                        {entry.action.replace("_", " ")}
                      </span>
                      {" "}
                      <span style={{ color: "#888", textTransform: "capitalize" }}>{entry.entity_type}</span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#666", marginTop: 2 }}>
                      {entry.admin_email} - {timeAgo(entry.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #2a2a2a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                color: "#ededed",
                margin: 0,
              }}
            >
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              style={{
                fontSize: "0.8rem",
                color: "#c9a84c",
                textDecoration: "none",
              }}
            >
              View All →
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #2a2a2a",
                    color: "#888",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Order #
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Customer
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Total
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Payment
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid #1f1f1f",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#222")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#c9a84c",
                          fontWeight: 600,
                        }}
                      >
                        {order.order_number}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#ddd" }}>
                        {order.customer_name}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#ddd" }}>
                        {formatCurrency(order.total)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background:
                              (paymentColor[order.payment_status] || "#888") +
                              "22",
                            color:
                              paymentColor[order.payment_status] || "#888",
                          }}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background:
                              (statusColor[order.order_status] || "#888") +
                              "22",
                            color: statusColor[order.order_status] || "#888",
                          }}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#888" }}>
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
