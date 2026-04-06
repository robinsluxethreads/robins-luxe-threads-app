"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  size: string;
  quantity: number;
  emoji?: string | null;
  image?: string | null;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  order_status: string;
  created_at: string;
}

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (err || !data) {
      setError("Order not found");
    } else {
      setOrder(data as Order);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: "#999", marginTop: 16 }}>Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: "#ef4444", fontSize: 18 }}>{error || "Order not found"}</p>
        <Link href="/shop" style={styles.continueBtn}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const items: OrderItem[] = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <div style={styles.container}>
      {/* Success Check */}
      <div style={styles.successHeader}>
        <div style={styles.checkCircle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={styles.successTitle}>Order Confirmed!</h1>
        <p style={styles.orderNumber}>Order #{order.order_number}</p>
        <p style={{ color: "#888", fontSize: 14 }}>
          Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div style={styles.grid} className="order-grid">
        {/* Items */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Items Ordered</h2>
          {items.map((item, i) => (
            <div key={i} style={styles.orderItem}>
              <div style={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 28 }}>{item.emoji || "👗"}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#ededed", margin: 0, fontWeight: 500 }}>{item.name}</p>
                <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
                  Size: {item.size} | Qty: {item.quantity}
                </p>
              </div>
              <p style={{ color: "#c9a84c", fontWeight: 600, margin: 0 }}>
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}

          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Shipping</span>
            <span style={{ color: order.shipping === 0 ? "#2ecc71" : "#ededed" }}>
              {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
            </span>
          </div>
          <div style={styles.divider} />
          <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ color: "#c9a84c" }}>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Details */}
        <div>
          {/* Payment Status */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Payment</h2>
            <div style={styles.detailRow}>
              <span style={{ color: "#888" }}>Method</span>
              <span style={{ color: "#ededed", textTransform: "capitalize" }}>
                {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={{ color: "#888" }}>Status</span>
              <span
                style={{
                  color: order.payment_status === "paid" ? "#2ecc71" : "#f39c12",
                  fontWeight: 600,
                }}
              >
                {order.payment_status === "paid"
                  ? "Paid"
                  : "COD - Pay on Delivery"}
              </span>
            </div>
            {order.payment_id && (
              <div style={styles.detailRow}>
                <span style={{ color: "#888" }}>Payment ID</span>
                <span style={{ color: "#ededed", fontSize: 12 }}>{order.payment_id}</span>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Shipping Address</h2>
            <p style={{ color: "#ededed", margin: 0, lineHeight: 1.6 }}>
              {order.customer_name}<br />
              {order.shipping_address}<br />
              {order.customer_email}
            </p>
          </div>

          {/* Order Status */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Order Status</h2>
            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: 20,
                background: "rgba(46, 204, 113, 0.15)",
                color: "#2ecc71",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {order.order_status}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <Link href="/shop" style={styles.continueBtn}>
          Continue Shopping
        </Link>
        <Link href="/account" style={styles.ordersLink}>
          View All Orders
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "100px 16px 60px",
  },
  loadingContainer: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #222",
    borderTop: "3px solid #c9a84c",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  successHeader: {
    textAlign: "center" as const,
    marginBottom: 40,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(46, 204, 113, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    color: "#2ecc71",
    margin: "0 0 8px",
  },
  orderNumber: {
    fontSize: 16,
    color: "#c9a84c",
    fontWeight: 600,
    margin: "0 0 4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 24,
  },
  section: {
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    color: "#ededed",
    margin: "0 0 16px",
  },
  orderItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    background: "#1a1a1a",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: "#222",
    margin: "12px 0",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#ededed",
    fontSize: 14,
    marginBottom: 8,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    fontSize: 14,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginTop: 32,
    flexWrap: "wrap" as const,
  },
  continueBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
  ordersLink: {
    padding: "14px 32px",
    border: "1px solid #c9a84c",
    color: "#c9a84c",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
    background: "transparent",
  },
};
