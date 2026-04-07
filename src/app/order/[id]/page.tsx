"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

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
  customer_phone: string;
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
  confirmed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
}

const ORDER_FLOW = ["Placed", "Confirmed", "Shipped", "Delivered"];

function OrderTimeline({ order }: { order: Order }) {
  const isCancelled = order.order_status === "Cancelled";
  const currentIdx = ORDER_FLOW.indexOf(order.order_status);

  const steps = isCancelled ? [...ORDER_FLOW, "Cancelled"] : ORDER_FLOW;

  const getStepDate = (step: string): string | null => {
    switch (step) {
      case "Placed":
        return order.created_at;
      case "Confirmed":
        return order.confirmed_at || null;
      case "Shipped":
        return order.shipped_at || null;
      case "Delivered":
        return order.delivered_at || null;
      case "Cancelled":
        return order.cancelled_at || null;
      default:
        return null;
    }
  };

  const getStepStatus = (step: string, idx: number) => {
    if (isCancelled && step === "Cancelled") return "cancelled";
    if (isCancelled && idx > 0) return "pending";
    if (idx < currentIdx) return "completed";
    if (idx === currentIdx) return "current";
    return "pending";
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, padding: "12px 0" }}>
      {steps.map((step, idx) => {
        const status = getStepStatus(step, idx);
        const date = getStepDate(step);
        const isLast = idx === steps.length - 1;

        let circleColor = "#333";
        let circleBorder = "#555";
        let textColor = "#555";

        if (status === "completed") {
          circleColor = "#22c55e";
          circleBorder = "#22c55e";
          textColor = "#22c55e";
        } else if (status === "current") {
          circleColor = "#c9a84c";
          circleBorder = "#c9a84c";
          textColor = "#c9a84c";
        } else if (status === "cancelled") {
          circleColor = "#ef4444";
          circleBorder = "#ef4444";
          textColor = "#ef4444";
        }

        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              flex: isLast ? "none" : 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: status === "pending" ? "transparent" : circleColor,
                  border: `2px solid ${circleBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {status === "completed" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {status === "cancelled" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "0.7rem", color: textColor, marginTop: 6, fontWeight: 600, textAlign: "center" }}>
                {step}
              </span>
              {date && (
                <span style={{ fontSize: "0.6rem", color: "#666", marginTop: 2 }}>
                  {new Date(date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background:
                    status === "completed"
                      ? "#22c55e"
                      : status === "current"
                      ? "linear-gradient(90deg, #c9a84c, #333)"
                      : "#333",
                  marginBottom: date ? 30 : 20,
                  minWidth: 16,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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
      trackEvent("purchase", "ecommerce", data.order_number, data.total);
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

      {/* Order Timeline */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Order Progress</h2>
        <OrderTimeline order={order} />
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
          {order.tax > 0 && (
            <div style={styles.totalRow}>
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
          )}
          <div style={styles.divider} />
          <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ color: "#c9a84c" }}>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Details */}
        <div>
          {/* Payment Card */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Payment Details</h2>
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
                  color: order.payment_status === "paid" || order.payment_status === "Paid" ? "#2ecc71" : "#f39c12",
                  fontWeight: 600,
                }}
              >
                {order.payment_status === "paid" || order.payment_status === "Paid"
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

          {/* Shipping Address Card */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Shipping Address</h2>
            <p style={{ color: "#ededed", margin: 0, lineHeight: 1.6 }}>
              {order.customer_name}<br />
              {order.shipping_address}<br />
              {order.customer_email}
              {order.customer_phone && (
                <>
                  <br />
                  {order.customer_phone}
                </>
              )}
            </p>
          </div>

          {/* Need Help Card */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Need Help?</h2>
            <p style={{ color: "#888", fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
              Have questions about your order? We are here to help.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                border: "1px solid #c9a84c",
                color: "#c9a84c",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Contact Us
            </Link>
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
