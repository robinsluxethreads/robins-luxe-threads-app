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

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  totalSubscribers: number;
  totalReviews: number;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalSubscribers: 0,
    totalReviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        { count: productCount },
        { count: orderCount },
        { data: orders },
        { count: customerCount },
        { count: pendingCount },
        { count: subscriberCount },
        { data: products },
        { count: reviewCount },
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
      ]);

      const allOrders = orders || [];
      const totalRevenue = allOrders.reduce(
        (sum, o) => sum + (o.total || 0),
        0
      );

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue,
        totalCustomers: customerCount || 0,
        pendingOrders: pendingCount || 0,
        totalSubscribers: subscriberCount || 0,
        totalReviews: reviewCount || 0,
      });

      setRecentOrders(allOrders.slice(0, 10));

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
  );
}
