"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface CouponForm {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  min_order: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  code: "",
  type: "percentage",
  value: "",
  min_order: "",
  max_uses: "",
  expires_at: "",
  is_active: true,
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      min_order: coupon.min_order ? String(coupon.min_order) : "",
      max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
      expires_at: coupon.expires_at
        ? new Date(coupon.expires_at).toISOString().split("T")[0]
        : "",
      is_active: coupon.is_active,
    });
    setEditingId(coupon.id);
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) {
      setError("Code and value are required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value),
      min_order: form.min_order ? parseFloat(form.min_order) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    let result;
    if (editingId) {
      result = await supabase.from("coupons").update(payload).eq("id", editingId);
    } else {
      result = await supabase.from("coupons").insert({ ...payload, used_count: 0 });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setShowModal(false);
      fetchCoupons();
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);
    fetchCoupons();
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
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
          Coupons
        </h1>
        <button onClick={openCreate} style={styles.createBtn}>
          + Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #2a2a2a",
                  color: "#888",
                  textAlign: "left",
                }}
              >
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Value</th>
                <th style={styles.th}>Min Order</th>
                <th style={styles.th}>Max Uses</th>
                <th style={styles.th}>Used</th>
                <th style={styles.th}>Expires</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: "2rem", textAlign: "center", color: "#888" }}
                  >
                    No coupons created yet
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    style={{ borderBottom: "1px solid #1f1f1f" }}
                  >
                    <td style={{ ...styles.td, color: "#c9a84c", fontWeight: 600 }}>
                      {coupon.code}
                    </td>
                    <td style={styles.td}>
                      {coupon.type === "percentage" ? "Percentage" : "Fixed"}
                    </td>
                    <td style={styles.td}>
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : `\u20B9${coupon.value}`}
                    </td>
                    <td style={styles.td}>
                      {coupon.min_order
                        ? `\u20B9${coupon.min_order.toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td style={styles.td}>
                      {coupon.max_uses || "Unlimited"}
                    </td>
                    <td style={styles.td}>{coupon.used_count}</td>
                    <td style={styles.td}>
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Never"}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => toggleActive(coupon)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          background: coupon.is_active
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.15)",
                          color: coupon.is_active ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openEdit(coupon)}
                          style={styles.actionBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          style={{ ...styles.actionBtn, color: "#ef4444" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </h2>

            <div style={styles.formField}>
              <label style={styles.label}>Coupon Code</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. WELCOME20"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button
                  onClick={() => setForm({ ...form, code: generateCode() })}
                  style={styles.generateBtn}
                  type="button"
                >
                  Generate
                </button>
              </div>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Discount Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "percentage" | "fixed",
                  })
                }
                style={styles.input}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (INR)</option>
              </select>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                Value ({form.type === "percentage" ? "%" : "INR"})
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                style={styles.input}
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Minimum Order Amount (optional)</label>
              <input
                type="number"
                value={form.min_order}
                onChange={(e) =>
                  setForm({ ...form, min_order: e.target.value })
                }
                placeholder="e.g. 2000"
                style={styles.input}
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                Max Uses (leave blank for unlimited)
              </label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm({ ...form, max_uses: e.target.value })
                }
                placeholder="e.g. 100"
                style={styles.input}
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formField}>
              <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  style={{ accentColor: "#c9a84c" }}
                />
                Active
              </label>
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  createBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  th: {
    padding: "0.75rem 1rem",
    fontWeight: 500,
  },
  td: {
    padding: "0.75rem 1rem",
    color: "#ddd",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "#c9a84c",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    color: "#ededed",
    margin: "0 0 24px",
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#bbb",
    fontWeight: 500,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  generateBtn: {
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid #c9a84c",
    color: "#c9a84c",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  saveBtn: {
    flex: 1,
    padding: "12px 24px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #333",
    color: "#888",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  },
};
