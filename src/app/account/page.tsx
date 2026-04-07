"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { isValidPhone, isValidPincode } from "@/lib/validation";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Profile {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

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
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: string;
  subtotal: number;
  shipping: number;
  tax: number;
}

interface FieldErrors {
  [key: string]: string;
}

const ORDER_FLOW = ["Placed", "Confirmed", "Shipped", "Delivered"];
const STATUS_FILTERS = ["All", "Active", "Delivered", "Cancelled"];

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function OrderProgressBar({ status }: { status: string }) {
  const isCancelled = status === "Cancelled";
  const currentIdx = ORDER_FLOW.indexOf(status);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "8px 0" }}>
      {ORDER_FLOW.map((step, idx) => {
        const isCompleted = !isCancelled && idx < currentIdx;
        const isCurrent = !isCancelled && idx === currentIdx;
        const isLast = idx === ORDER_FLOW.length - 1;

        let color = "#333";
        if (isCompleted) color = "#22c55e";
        else if (isCurrent) color = "#c9a84c";

        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              flex: isLast ? "none" : 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 50 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: isCompleted || isCurrent ? color : "transparent",
                  border: `2px solid ${isCompleted || isCurrent ? color : "#555"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isCompleted && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "0.6rem", color: isCompleted ? "#22c55e" : isCurrent ? "#c9a84c" : "#555", marginTop: 3, fontWeight: 500, textAlign: "center" }}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: isCompleted ? "#22c55e" : "#333",
                  marginBottom: 16,
                  minWidth: 8,
                }}
              />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 50, marginLeft: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #ef4444",
            }}
          />
          <span style={{ fontSize: "0.6rem", color: "#ef4444", marginTop: 3, fontWeight: 500 }}>
            Cancelled
          </span>
        </div>
      )}
    </div>
  );
}

function AccountContent() {
  const { user, signOut } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const validateField = useCallback((name: string, value: string) => {
    let error = "";
    switch (name) {
      case "full_name":
        if (value.trim().length < 2) error = "Name must be at least 2 characters";
        else if (/\d/.test(value)) error = "Name cannot contain numbers";
        break;
      case "phone":
        if (value && !isValidPhone(value.replace(/\s/g, "")))
          error = "Enter a valid 10-digit phone number";
        break;
      case "address":
        if (value && value.trim().length < 10)
          error = "Address must be at least 10 characters";
        break;
      case "pincode":
        if (value && !isValidPincode(value))
          error = "Enter a valid 6-digit pincode";
        break;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  }, []);

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Pincode auto-fill
  const handlePincodeChange = async (pincode: string) => {
    const digits = pincode.replace(/\D/g, "").slice(0, 6);
    setProfile((prev) => ({ ...prev, pincode: digits }));

    if (digits.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
        const data = await res.json();
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setProfile((prev) => ({
            ...prev,
            city: po.District || prev.city,
            state: po.State || prev.state,
          }));
        }
      } catch {
        // Silently fail - user can fill manually
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setProfile((prev) => ({ ...prev, phone: digits }));
  };

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, address, city, state, pincode")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });
    }

    // Fetch orders with items
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_method, payment_status, order_status, created_at, items, shipping_address, subtotal, shipping, tax")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData as Order[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all fields
    const fields = ["full_name", "phone", "address", "pincode"];
    const values: Record<string, string> = {
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      pincode: profile.pincode,
    };
    fields.forEach((f) => {
      setTouched((prev) => ({ ...prev, [f]: true }));
      validateField(f, values[f]);
    });

    // Check for existing errors
    if (Object.keys(fieldErrors).length > 0) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Profile updated successfully!", type: "success" });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleReorder = (order: Order) => {
    const items = order.items || [];
    items.forEach((item) => {
      addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        size: item.size || "Free Size",
        emoji: item.emoji || null,
        image: item.image || null,
      });
    });
    router.push("/cart");
  };

  const displayName =
    profile.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const getInputStyle = (name: string): React.CSSProperties => {
    if (!touched[name]) return styles.input;
    if (fieldErrors[name]) return { ...styles.input, borderColor: "#e74c3c" };
    return { ...styles.input, borderColor: "#2ecc71" };
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Active")
      return ["Placed", "Confirmed", "Shipped"].includes(o.order_status);
    return o.order_status === statusFilter;
  });

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h1 style={styles.heading}>Welcome, {displayName}</h1>
          <p style={styles.email}>{user?.email || user?.phone}</p>
        </div>

        {/* Profile Form */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Details</h2>

          {message && (
            <div
              style={{
                ...styles.message,
                background:
                  message.type === "success"
                    ? "rgba(46, 204, 113, 0.15)"
                    : "rgba(231, 76, 60, 0.15)",
                borderColor: message.type === "success" ? "#2ecc71" : "#e74c3c",
                color: message.type === "success" ? "#2ecc71" : "#e74c3c",
              }}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <p style={{ color: "#666", textAlign: "center", padding: 20 }}>Loading profile...</p>
          ) : (
            <form onSubmit={handleUpdate} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  onBlur={() => handleBlur("full_name", profile.full_name)}
                  placeholder="Your full name"
                  style={getInputStyle("full_name")}
                />
                {touched.full_name && fieldErrors.full_name && (
                  <span style={styles.fieldError}>{fieldErrors.full_name}</span>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone</label>
                <div style={{ position: "relative" as const }}>
                  <span style={styles.phonePrefix}>+91</span>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(profile.phone)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => handleBlur("phone", profile.phone)}
                    placeholder="98765 43210"
                    style={{ ...getInputStyle("phone"), paddingLeft: 48 }}
                  />
                </div>
                {touched.phone && fieldErrors.phone && (
                  <span style={styles.fieldError}>{fieldErrors.phone}</span>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  onBlur={() => handleBlur("address", profile.address)}
                  placeholder="Street address"
                  style={getInputStyle("address")}
                />
                {touched.address && fieldErrors.address && (
                  <span style={styles.fieldError}>{fieldErrors.address}</span>
                )}
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="City"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>State</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="State"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 0.7 }}>
                  <label style={styles.label}>Pincode</label>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    onBlur={() => handleBlur("pincode", profile.pincode)}
                    placeholder="110001"
                    style={getInputStyle("pincode")}
                    maxLength={6}
                  />
                  {touched.pincode && fieldErrors.pincode && (
                    <span style={styles.fieldError}>{fieldErrors.pincode}</span>
                  )}
                </div>
              </div>

              <button type="submit" disabled={saving} style={styles.primaryBtn}>
                {saving ? "Updating..." : "Update Profile"}
              </button>
            </form>
          )}
        </div>

        {/* Orders Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Orders</h2>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: "6px 14px",
                  border: statusFilter === f ? "1px solid #c9a84c" : "1px solid #333",
                  borderRadius: 20,
                  background: statusFilter === f ? "rgba(201,168,76,0.15)" : "transparent",
                  color: statusFilter === f ? "#c9a84c" : "#888",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: statusFilter === f ? 600 : 400,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={styles.emptyOrders}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <p style={{ color: "#666", marginTop: 12 }}>
                {statusFilter === "All" ? "No orders yet. Start shopping!" : `No ${statusFilter.toLowerCase()} orders`}
              </p>
              {statusFilter === "All" && (
                <Link
                  href="/shop"
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    color: "#c9a84c",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Browse Collection →
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

                return (
                  <div key={order.id}>
                    {/* Order card */}
                    <div
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{
                        padding: "14px 16px",
                        background: "#1a1a1a",
                        borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                        border: isExpanded ? "1px solid #c9a84c33" : "1px solid #222",
                        borderBottom: isExpanded ? "none" : "1px solid #222",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ color: "#c9a84c", fontWeight: 600, fontSize: 14, margin: 0 }}>
                            {order.order_number}
                          </p>
                          <p style={{ color: "#888", fontSize: 12, margin: "4px 0 0" }}>
                            {new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" | "}
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" as const }}>
                          <p style={{ color: "#ededed", fontWeight: 600, fontSize: 14, margin: 0 }}>
                            {formatPrice(order.total)}
                          </p>
                          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", justifyContent: "flex-end" }}>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background:
                                  order.payment_status === "paid" || order.payment_status === "Paid"
                                    ? "rgba(46,204,113,0.15)"
                                    : "rgba(243,156,18,0.15)",
                                color: order.payment_status === "paid" || order.payment_status === "Paid" ? "#2ecc71" : "#f39c12",
                              }}
                            >
                              {order.payment_status === "paid" || order.payment_status === "Paid" ? "Paid" : "COD"}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background:
                                  order.order_status === "Delivered"
                                    ? "rgba(34,197,94,0.15)"
                                    : order.order_status === "Cancelled"
                                    ? "rgba(239,68,68,0.15)"
                                    : "rgba(201,168,76,0.15)",
                                color:
                                  order.order_status === "Delivered"
                                    ? "#22c55e"
                                    : order.order_status === "Cancelled"
                                    ? "#ef4444"
                                    : "#c9a84c",
                                textTransform: "capitalize",
                              }}
                            >
                              {order.order_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar (always visible) */}
                      <div style={{ marginTop: 8 }}>
                        <OrderProgressBar status={order.order_status} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: "16px",
                          background: "#151515",
                          border: "1px solid #c9a84c33",
                          borderTop: "1px solid #222",
                          borderRadius: "0 0 10px 10px",
                        }}
                      >
                        {/* Items */}
                        <h4 style={{ color: "#ededed", fontSize: 13, margin: "0 0 8px", fontWeight: 600 }}>
                          Items
                        </h4>
                        {items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 0",
                              borderBottom: i < items.length - 1 ? "1px solid #1f1f1f" : "none",
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 6,
                                background: "#1a1a1a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {item.image ? (
                                <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: 18 }}>{item.emoji || "👗"}</span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: "#ccc", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.name}
                              </p>
                              <p style={{ color: "#666", fontSize: 11, margin: "2px 0 0" }}>
                                {item.size && `Size: ${item.size} | `}Qty: {item.quantity}
                              </p>
                            </div>
                            <span style={{ color: "#c9a84c", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}

                        {/* Shipping address */}
                        {order.shipping_address && (
                          <div style={{ marginTop: 12 }}>
                            <h4 style={{ color: "#ededed", fontSize: 13, margin: "0 0 4px", fontWeight: 600 }}>
                              Shipping Address
                            </h4>
                            <p style={{ color: "#888", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                              {order.shipping_address}
                            </p>
                          </div>
                        )}

                        {/* Payment details */}
                        <div style={{ marginTop: 12 }}>
                          <h4 style={{ color: "#ededed", fontSize: 13, margin: "0 0 4px", fontWeight: 600 }}>
                            Payment
                          </h4>
                          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
                            {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
                            {" - "}
                            <span style={{ color: order.payment_status === "paid" || order.payment_status === "Paid" ? "#2ecc71" : "#f39c12" }}>
                              {order.payment_status === "paid" || order.payment_status === "Paid" ? "Paid" : "Pending"}
                            </span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(order);
                            }}
                            style={{
                              padding: "8px 16px",
                              background: "linear-gradient(135deg, #c9a84c, #b8942e)",
                              color: "#0a0a0a",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Reorder
                          </button>
                          <Link
                            href={`/order/${order.id}`}
                            style={{
                              padding: "8px 16px",
                              border: "1px solid #c9a84c",
                              color: "#c9a84c",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 500,
                              textDecoration: "none",
                              background: "transparent",
                            }}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleSignOut} style={styles.logoutBtn}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "calc(100vh - 64px)",
    padding: "40px 16px",
  },
  wrapper: {
    maxWidth: 600,
    margin: "0 auto",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 auto 16px",
    fontFamily: "'Playfair Display', serif",
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26,
    color: "#c9a84c",
    margin: 0,
  },
  email: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    background: "#111111",
    borderRadius: 12,
    border: "1px solid #222",
    padding: "28px 24px",
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    color: "#ededed",
    margin: "0 0 20px 0",
  },
  message: {
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    border: "1px solid",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    color: "#bbb",
    fontWeight: 500,
  },
  input: {
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  phonePrefix: {
    position: "absolute" as const,
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#888",
    fontSize: 15,
    pointerEvents: "none" as const,
  },
  fieldError: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 2,
  },
  primaryBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  emptyOrders: {
    textAlign: "center" as const,
    padding: "32px 16px",
  },
  logoutBtn: {
    width: "100%",
    padding: "14px",
    background: "transparent",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
