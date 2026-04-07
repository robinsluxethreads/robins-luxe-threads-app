"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { downloadCSV } from "@/lib/csvExport";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
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

const STATUS_OPTIONS = [
  "All",
  "Placed",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const ORDER_FLOW = ["Placed", "Confirmed", "Shipped", "Delivered"];

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

function OrderTimeline({ order }: { order: Order }) {
  const isCancelled = order.order_status === "Cancelled";
  const currentIdx = ORDER_FLOW.indexOf(order.order_status);

  const steps = isCancelled
    ? [...ORDER_FLOW, "Cancelled"]
    : ORDER_FLOW;

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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, padding: "8px 0" }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: status === "pending" ? "transparent" : circleColor,
                  border: `2px solid ${circleBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {status === "completed" && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "0.65rem", color: textColor, marginTop: 4, fontWeight: 600, textAlign: "center" }}>
                {step}
              </span>
              {date && (
                <span style={{ fontSize: "0.55rem", color: "#666", marginTop: 2 }}>
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
                  marginBottom: date ? 28 : 18,
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "All") {
      query = query.eq("order_status", statusFilter);
    }
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: newStatus })
      .eq("id", id);
    if (error) {
      alert("Error updating: " + error.message);
    } else {
      fetchOrders();
    }
  }

  function handleExportCSV() {
    const csvData = orders.map((o) => ({
      "Order #": o.order_number,
      Date: new Date(o.created_at).toLocaleDateString("en-IN"),
      Customer: o.customer_name,
      Email: o.customer_email,
      Phone: o.customer_phone,
      Address: o.shipping_address,
      Items: (o.items || []).map((item) => `${item.name} x${item.quantity}`).join("; "),
      Subtotal: o.subtotal,
      Shipping: o.shipping,
      Tax: o.tax,
      Total: o.total,
      "Payment Method": o.payment_method,
      "Payment Status": o.payment_status,
      "Order Status": o.order_status,
    }));
    downloadCSV(csvData, "orders");
  }

  const formatCurrency = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#fff",
    fontSize: "0.85rem",
    fontFamily: "'Poppins', sans-serif",
    outline: "none",
  };

  const outlineBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    background: "transparent",
    color: "#c9a84c",
    border: "1px solid #c9a84c",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 500,
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.75rem",
            color: "#ededed",
            margin: 0,
          }}
        >
          Orders
        </h1>
        <button onClick={handleExportCSV} style={outlineBtnStyle}>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search order # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 280 }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "0.5rem 0.9rem",
                border:
                  statusFilter === s
                    ? "1px solid #c9a84c"
                    : "1px solid #2a2a2a",
                borderRadius: 8,
                background:
                  statusFilter === s ? "rgba(201,168,76,0.15)" : "transparent",
                color: statusFilter === s ? "#c9a84c" : "#888",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: statusFilter === s ? 600 : 400,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
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
                  Date
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Customer
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Items
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
                  Actions
                </th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              </tbody>
            ) : orders.length === 0 ? (
              <tbody>
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    No orders found
                  </td>
                </tr>
              </tbody>
            ) : (
              orders.map((order) => (
                <tbody key={order.id}>
                    <tr
                      onClick={() =>
                        setExpandedId(
                          expandedId === order.id ? null : order.id
                        )
                      }
                      style={{
                        borderBottom: "1px solid #1f1f1f",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#222")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          expandedId === order.id ? "#1e1e1e" : "transparent")
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
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#ddd" }}>
                        {order.customer_name}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {(order.items || []).length} item
                        {(order.items || []).length !== 1 ? "s" : ""}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#c9a84c",
                          fontWeight: 600,
                        }}
                      >
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
                        {order.payment_method && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.7rem",
                              color: "#666",
                            }}
                          >
                            ({order.payment_method})
                          </span>
                        )}
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
                            color:
                              statusColor[order.order_status] || "#888",
                          }}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td
                        style={{ padding: "0.75rem 1rem" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={order.order_status}
                          onChange={(e) =>
                            updateStatus(order.id, e.target.value)
                          }
                          style={{
                            padding: "4px 8px",
                            background: "#111",
                            border: "1px solid #2a2a2a",
                            borderRadius: 6,
                            color: "#ccc",
                            fontSize: "0.75rem",
                            fontFamily: "'Poppins', sans-serif",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          {[...ORDER_FLOW, "Cancelled"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {expandedId === order.id && (
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: "1rem 1.5rem",
                            background: "#151515",
                            borderBottom: "1px solid #2a2a2a",
                          }}
                        >
                          {/* Order Timeline */}
                          <div style={{ marginBottom: 16 }}>
                            <h4
                              style={{
                                color: "#c9a84c",
                                fontSize: "0.85rem",
                                marginBottom: "0.5rem",
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Order Progress
                            </h4>
                            <OrderTimeline order={order} />
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1.5rem",
                            }}
                          >
                            {/* Customer info */}
                            <div>
                              <h4
                                style={{
                                  color: "#c9a84c",
                                  fontSize: "0.85rem",
                                  marginBottom: "0.5rem",
                                  fontFamily: "'Poppins', sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                Customer Details
                              </h4>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#aaa",
                                  lineHeight: 1.8,
                                }}
                              >
                                <div>
                                  <strong style={{ color: "#ccc" }}>
                                    Name:
                                  </strong>{" "}
                                  {order.customer_name}
                                </div>
                                <div>
                                  <strong style={{ color: "#ccc" }}>
                                    Email:
                                  </strong>{" "}
                                  {order.customer_email}
                                </div>
                                <div>
                                  <strong style={{ color: "#ccc" }}>
                                    Phone:
                                  </strong>{" "}
                                  {order.customer_phone}
                                </div>
                                <div>
                                  <strong style={{ color: "#ccc" }}>
                                    Address:
                                  </strong>{" "}
                                  {order.shipping_address}
                                </div>
                                {order.payment_id && (
                                  <div>
                                    <strong style={{ color: "#ccc" }}>
                                      Payment ID:
                                    </strong>{" "}
                                    {order.payment_id}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Order items */}
                            <div>
                              <h4
                                style={{
                                  color: "#c9a84c",
                                  fontSize: "0.85rem",
                                  marginBottom: "0.5rem",
                                  fontFamily: "'Poppins', sans-serif",
                                  fontWeight: 600,
                                }}
                              >
                                Order Items
                              </h4>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#aaa",
                                }}
                              >
                                {(order.items || []).map(
                                  (item: OrderItem, idx: number) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "4px 0",
                                        borderBottom: "1px solid #1f1f1f",
                                      }}
                                    >
                                      <span>
                                        {item.name}
                                        {item.size
                                          ? ` (${item.size})`
                                          : ""}{" "}
                                        x{item.quantity}
                                      </span>
                                      <span style={{ color: "#ccc" }}>
                                        {formatCurrency(
                                          item.price * item.quantity
                                        )}
                                      </span>
                                    </div>
                                  )
                                )}
                                <div
                                  style={{
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: "1px solid #2a2a2a",
                                    fontSize: "0.8rem",
                                    lineHeight: 1.8,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <span>Subtotal</span>
                                    <span>
                                      {formatCurrency(order.subtotal)}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <span>Shipping</span>
                                    <span>
                                      {formatCurrency(order.shipping)}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <span>Tax</span>
                                    <span>{formatCurrency(order.tax)}</span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontWeight: 700,
                                      color: "#c9a84c",
                                      marginTop: 4,
                                    }}
                                  >
                                    <span>Total</span>
                                    <span>
                                      {formatCurrency(order.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              ))
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
