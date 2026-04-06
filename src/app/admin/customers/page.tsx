"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch orders to aggregate per customer
      const { data: orders } = await supabase.from("orders").select("customer_id, total");

      const orderMap: Record<string, { count: number; total: number }> = {};
      (orders || []).forEach((o) => {
        if (o.customer_id) {
          if (!orderMap[o.customer_id]) {
            orderMap[o.customer_id] = { count: 0, total: 0 };
          }
          orderMap[o.customer_id].count++;
          orderMap[o.customer_id].total += o.total || 0;
        }
      });

      const result: Customer[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name || p.name || "Unknown",
        email: p.email || "",
        phone: p.phone || "",
        city: p.city || p.address || "",
        created_at: p.created_at,
        order_count: orderMap[p.id]?.count || 0,
        total_spent: orderMap[p.id]?.total || 0,
      }));

      setCustomers(result);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

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
        Customers
      </h1>

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 320 }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
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
                  Name
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Email
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Phone
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  City
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Orders
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Total Spent
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      onClick={() =>
                        setExpandedId(expandedId === c.id ? null : c.id)
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
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#ededed",
                          fontWeight: 500,
                        }}
                      >
                        {c.full_name}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {c.email}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {c.phone || "--"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {c.city || "--"}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#c9a84c",
                          fontWeight: 600,
                        }}
                      >
                        {c.order_count}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#c9a84c",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(c.total_spent)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#888" }}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "--"}
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr key={c.id + "-detail"}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "1rem 1.5rem",
                            background: "#151515",
                            borderBottom: "1px solid #2a2a2a",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#aaa",
                              lineHeight: 1.8,
                            }}
                          >
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                Full Name:
                              </strong>{" "}
                              {c.full_name}
                            </div>
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                Email:
                              </strong>{" "}
                              {c.email}
                            </div>
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                Phone:
                              </strong>{" "}
                              {c.phone || "Not provided"}
                            </div>
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                City:
                              </strong>{" "}
                              {c.city || "Not provided"}
                            </div>
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                Total Orders:
                              </strong>{" "}
                              {c.order_count}
                            </div>
                            <div>
                              <strong style={{ color: "#ccc" }}>
                                Total Spent:
                              </strong>{" "}
                              {formatCurrency(c.total_spent)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Count */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid #2a2a2a",
            fontSize: "0.8rem",
            color: "#888",
          }}
        >
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
