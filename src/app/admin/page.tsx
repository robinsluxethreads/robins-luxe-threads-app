"use client";

import { useEffect, useState } from "react";
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

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  totalSubscribers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalSubscribers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [
        { count: productCount },
        { count: orderCount },
        { data: orders },
        { count: customerCount },
        { count: pendingCount },
        { count: subscriberCount },
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
      ]);

      const totalRevenue = (orders || []).reduce(
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
      });

      setRecentOrders((orders || []).slice(0, 10));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: "👗" },
    { label: "Total Orders", value: stats.totalOrders, icon: "📦" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: "💰" },
    { label: "Total Customers", value: stats.totalCustomers, icon: "👥" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: "⏳" },
    { label: "Subscribers", value: stats.totalSubscribers, icon: "📧" },
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
              {card.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#888" }}>
              {card.label}
            </div>
          </div>
        ))}
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
