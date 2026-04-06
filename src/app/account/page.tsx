"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Profile {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: number;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

function AccountContent() {
  const { user, signOut } = useAuth();
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

    // Fetch orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_method, payment_status, order_status, created_at")
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

  const displayName =
    profile.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

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
                  placeholder="Your full name"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Street address"
                  style={styles.input}
                />
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
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    placeholder="110001"
                    style={styles.input}
                    maxLength={6}
                  />
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
          {orders.length === 0 ? (
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
              <p style={{ color: "#666", marginTop: 12 }}>No orders yet</p>
              <p style={{ color: "#555", fontSize: 13 }}>
                When you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#1a1a1a",
                    borderRadius: 10,
                    border: "1px solid #222",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
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
                    </p>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    <p style={{ color: "#ededed", fontWeight: 600, fontSize: 14, margin: 0 }}>
                      {formatPrice(order.total)}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background:
                            order.payment_status === "paid"
                              ? "rgba(46,204,113,0.15)"
                              : "rgba(243,156,18,0.15)",
                          color: order.payment_status === "paid" ? "#2ecc71" : "#f39c12",
                        }}
                      >
                        {order.payment_status === "paid" ? "Paid" : "COD"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: "rgba(201,168,76,0.15)",
                          color: "#c9a84c",
                          textTransform: "capitalize",
                        }}
                      >
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
