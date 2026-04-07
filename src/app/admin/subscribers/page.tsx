"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { downloadCSV } from "@/lib/csvExport";

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    setLoading(true);
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscribers(data || []);
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("subscribers")
      .update({ is_active: !current })
      .eq("id", id);
    fetchSubscribers();
  }

  function exportCSV() {
    const csvData = subscribers.map((s) => ({
      Email: s.email,
      Status: s.is_active ? "Active" : "Inactive",
      "Subscribed Date": new Date(s.created_at).toLocaleDateString("en-IN"),
    }));
    downloadCSV(csvData, "subscribers");
  }

  const activeCount = subscribers.filter((s) => s.is_active).length;

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
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.75rem",
              color: "#ededed",
              margin: 0,
            }}
          >
            Newsletter Subscribers
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
            {subscribers.length} total &middot; {activeCount} active
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={subscribers.length === 0}
          style={{
            padding: "0.6rem 1.25rem",
            background:
              subscribers.length === 0
                ? "#333"
                : "linear-gradient(135deg, #c9a84c, #d4b96a)",
            color: subscribers.length === 0 ? "#666" : "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: subscribers.length === 0 ? "default" : "pointer",
            fontSize: "0.85rem",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Export CSV
        </button>
      </div>

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
                  Email
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Subscribed Date
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Status
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    No subscribers yet
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr
                    key={s.id}
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
                        color: "#ededed",
                      }}
                    >
                      {s.email}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#888" }}>
                      {new Date(s.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: s.is_active ? "#22c55e22" : "#ef444422",
                          color: s.is_active ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button
                        onClick={() => toggleActive(s.id, s.is_active)}
                        style={{
                          padding: "4px 10px",
                          background: "#c9a84c22",
                          color: "#c9a84c",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
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
