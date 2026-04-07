"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const adminEmail = user?.email || "admin";
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }

  async function toggleRead(id: string, current: boolean) {
    await supabase
      .from("messages")
      .update({ is_read: !current })
      .eq("id", id);
    await logActivity(adminEmail, "status_changed", "message", id, { is_read: !current });
    fetchMessages();
  }

  async function handleDelete(id: string) {
    const msg = messages.find((m) => m.id === id);
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      await logActivity(adminEmail, "deleted", "message", id, { from: msg?.name, subject: msg?.subject });
      setDeleteConfirm(null);
      fetchMessages();
    }
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
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
          Messages
        </h1>
        {unreadCount > 0 && (
          <span
            style={{
              padding: "4px 12px",
              background: "#ef444422",
              color: "#ef4444",
              borderRadius: 12,
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {unreadCount} unread
          </span>
        )}
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
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500, width: 24 }}></th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Date</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Name</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Email</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Subject</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Message</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    Loading...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    No messages yet
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <>
                    <tr
                      key={msg.id}
                      onClick={() =>
                        setExpandedId(expandedId === msg.id ? null : msg.id)
                      }
                      style={{
                        borderBottom: "1px solid #1f1f1f",
                        cursor: "pointer",
                        transition: "background 0.15s",
                        background: !msg.is_read
                          ? "rgba(201,168,76,0.03)"
                          : "transparent",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#222")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = !msg.is_read
                          ? "rgba(201,168,76,0.03)"
                          : "transparent")
                      }
                    >
                      <td style={{ padding: "0.75rem 0.5rem 0.75rem 1rem" }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: msg.is_read ? "transparent" : "#c9a84c",
                          }}
                        />
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#888", whiteSpace: "nowrap" }}>
                        {new Date(msg.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#ededed",
                          fontWeight: msg.is_read ? 400 : 600,
                        }}
                      >
                        {msg.name}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                        {msg.email}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#ccc",
                          fontWeight: msg.is_read ? 400 : 500,
                        }}
                      >
                        {msg.subject || "--"}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#888",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {msg.message}
                      </td>
                      <td
                        style={{ padding: "0.75rem 1rem" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => toggleRead(msg.id, msg.is_read)}
                            style={{
                              padding: "4px 8px",
                              background: "#c9a84c22",
                              color: "#c9a84c",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              fontFamily: "'Poppins', sans-serif",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {msg.is_read ? "Mark Unread" : "Mark Read"}
                          </button>
                          {deleteConfirm === msg.id ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() => handleDelete(msg.id)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#ef4444",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                  fontFamily: "'Poppins', sans-serif",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#333",
                                  color: "#aaa",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                  fontFamily: "'Poppins', sans-serif",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(msg.id)}
                              style={{
                                padding: "4px 8px",
                                background: "#ef444422",
                                color: "#ef4444",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded message */}
                    {expandedId === msg.id && (
                      <tr key={msg.id + "-detail"}>
                        <td
                          colSpan={7}
                          style={{
                            padding: "1rem 1.5rem",
                            background: "#151515",
                            borderBottom: "1px solid #2a2a2a",
                          }}
                        >
                          <div style={{ maxWidth: 600 }}>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#888",
                                marginBottom: 4,
                              }}
                            >
                              From: {msg.name} ({msg.email})
                            </div>
                            {msg.subject && (
                              <div
                                style={{
                                  fontSize: "0.9rem",
                                  color: "#c9a84c",
                                  fontWeight: 600,
                                  marginBottom: 8,
                                }}
                              >
                                {msg.subject}
                              </div>
                            )}
                            <p
                              style={{
                                fontSize: "0.85rem",
                                color: "#ccc",
                                lineHeight: 1.7,
                                whiteSpace: "pre-wrap",
                                margin: 0,
                              }}
                            >
                              {msg.message}
                            </p>
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
      </div>
    </div>
  );
}
