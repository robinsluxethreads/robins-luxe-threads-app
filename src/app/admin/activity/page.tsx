"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ActivityEntry {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ENTITY_FILTERS = ["All", "product", "order", "coupon", "settings", "message"];
const PAGE_SIZE = 20;

const actionColors: Record<string, string> = {
  created: "#2ecc71",
  updated: "#3498db",
  deleted: "#e74c3c",
  status_changed: "#f39c12",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(details)) {
    if (val !== null && val !== undefined && key !== "ids") {
      parts.push(`${key}: ${val}`);
    }
  }
  return parts.join(", ");
}

export default function AdminActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("All");
  const [searchEmail, setSearchEmail] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("activity_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== "All") {
      query = query.eq("entity_type", entityFilter);
    }

    if (searchEmail) {
      query = query.ilike("admin_email", `%${searchEmail}%`);
    }

    const { data, count } = await query;
    setEntries(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, entityFilter, searchEmail]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
        Activity Log
      </h1>

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
          placeholder="Search by admin email..."
          value={searchEmail}
          onChange={(e) => { setSearchEmail(e.target.value); setPage(0); }}
          style={{ ...inputStyle, width: 280 }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setEntityFilter(f); setPage(0); }}
              style={{
                padding: "0.5rem 0.9rem",
                border: entityFilter === f ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                borderRadius: 8,
                background: entityFilter === f ? "rgba(201,168,76,0.15)" : "transparent",
                color: entityFilter === f ? "#c9a84c" : "#888",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: entityFilter === f ? 600 : 400,
                fontFamily: "'Poppins', sans-serif",
                textTransform: "capitalize",
              }}
            >
              {f === "All" ? "All" : f + "s"}
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
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Time</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Admin</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Action</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Entity</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    No activity recorded yet
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: "1px solid #1f1f1f",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#222")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "#888", whiteSpace: "nowrap" }}>
                      {timeAgo(entry.created_at)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#ccc" }}>
                      {entry.admin_email}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: (actionColors[entry.action] || "#888") + "22",
                          color: actionColors[entry.action] || "#888",
                          textTransform: "capitalize",
                        }}
                      >
                        {entry.action.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#aaa", textTransform: "capitalize" }}>
                      {entry.entity_type}
                      {entry.entity_id && (
                        <span style={{ color: "#666", marginLeft: 6, fontSize: "0.75rem" }}>
                          #{entry.entity_id.substring(0, 8)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#888", fontSize: "0.8rem", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatDetails(entry.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid #2a2a2a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem",
              color: "#888",
            }}
          >
            <span>
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "4px 12px",
                  background: "#222",
                  color: page === 0 ? "#555" : "#ccc",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  cursor: page === 0 ? "default" : "pointer",
                  fontSize: "0.8rem",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "4px 12px",
                  background: "#222",
                  color: page >= totalPages - 1 ? "#555" : "#ccc",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  fontSize: "0.8rem",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
