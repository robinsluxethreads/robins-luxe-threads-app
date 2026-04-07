"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { downloadCSV } from "@/lib/csvExport";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  category: string;
  description: string;
  sizes: string[];
  badge: string | null;
  emoji: string | null;
  images: string[];
  is_active: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface Category {
  id: string;
  name: string;
}

const BADGES = ["New", "Sale", "Hot", "Bestseller", "Limited"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const PAGE_SIZE = 10;

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  price: 0,
  old_price: null,
  category: "",
  description: "",
  sizes: [],
  badge: null,
  emoji: null,
  images: [],
  is_active: true,
  stock_quantity: 100,
  low_stock_threshold: 10,
};

type SortOption = "newest" | "low_stock";

export default function AdminProducts() {
  const { user } = useAuth();
  const adminEmail = user?.email || "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*", { count: "exact" });

    if (sortBy === "low_stock") {
      query = query.order("stock_quantity", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, count } = await query;
    setProducts(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Clear selection when page/search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search]);

  function openAdd() {
    setEditingProduct(null);
    setForm(emptyProduct);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: p.price,
      old_price: p.old_price,
      category: p.category,
      description: p.description,
      sizes: p.sizes || [],
      badge: p.badge,
      emoji: p.emoji,
      images: p.images || [],
      is_active: p.is_active,
      stock_quantity: p.stock_quantity ?? 100,
      low_stock_threshold: p.low_stock_threshold ?? 10,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(form)
          .eq("id", editingProduct.id);
        if (error) throw error;
        await logActivity(adminEmail, "updated", "product", editingProduct.id, { name: form.name });
      } else {
        const { data, error } = await supabase.from("products").insert([form]).select("id").single();
        if (error) throw error;
        await logActivity(adminEmail, "created", "product", data?.id, { name: form.name });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert("Error saving product: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const product = products.find((p) => p.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setDeleteConfirm(null);
      await logActivity(adminEmail, "deleted", "product", id, { name: product?.name });
      fetchProducts();
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("products")
      .update({ is_active: !current })
      .eq("id", id);
    await logActivity(adminEmail, "status_changed", "product", id, { is_active: !current });
    fetchProducts();
  }

  function toggleSize(size: string) {
    const sizes = form.sizes.includes(size)
      ? form.sizes.filter((s) => s !== size)
      : [...form.sizes, size];
    setForm({ ...form, sizes });
  }

  // Bulk operations
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", ids);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      await logActivity(adminEmail, "deleted", "product", undefined, { count: ids.length, ids });
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      fetchProducts();
    }
  }

  async function bulkSetActive(active: boolean) {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("products")
      .update({ is_active: active })
      .in("id", ids);
    if (error) {
      alert("Error updating: " + error.message);
    } else {
      setSelectedIds(new Set());
      fetchProducts();
    }
  }

  function handleExportCSV() {
    const csvData = products.map((p) => ({
      Name: p.name,
      Category: p.category,
      Price: p.price,
      "Old Price": p.old_price || "",
      Badge: p.badge || "",
      Emoji: p.emoji || "",
      Sizes: (p.sizes || []).join(", "),
      "Stock Quantity": p.stock_quantity ?? "",
      "Low Stock Threshold": p.low_stock_threshold ?? "",
      Status: p.is_active ? "Active" : "Inactive",
      Description: p.description || "",
      Images: (p.images || []).join("; "),
    }));
    downloadCSV(csvData, "products");
  }

  function getStockColor(p: Product): string {
    const qty = p.stock_quantity ?? 100;
    const threshold = p.low_stock_threshold ?? 10;
    if (qty === 0) return "#e74c3c";
    if (qty <= threshold) return "#f39c12";
    return "#2ecc71";
  }

  function getStockLabel(p: Product): string {
    const qty = p.stock_quantity ?? 100;
    const threshold = p.low_stock_threshold ?? 10;
    if (qty === 0) return "Out of Stock";
    if (qty <= threshold) return `Low: ${qty}`;
    return String(qty);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Shared styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.75rem",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#fff",
    fontSize: "0.85rem",
    fontFamily: "'Poppins', sans-serif",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    color: "#aaa",
    marginBottom: 4,
    fontWeight: 500,
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
      {/* Header */}
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
          Products
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/products/import" style={{ textDecoration: "none" }}>
            <button style={outlineBtnStyle}>Import Products</button>
          </Link>
          <button onClick={handleExportCSV} style={outlineBtnStyle}>
            Export CSV
          </button>
          <button
            onClick={openAdd}
            style={{
              padding: "0.6rem 1.25rem",
              background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.85rem",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ ...inputStyle, maxWidth: 360 }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(0); }}
          style={{
            ...inputStyle,
            maxWidth: 200,
            cursor: "pointer",
          }}
        >
          <option value="newest">Sort: Newest First</option>
          <option value="low_stock">Sort: Low Stock First</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #c9a84c",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#c9a84c", fontSize: "0.85rem", fontWeight: 600 }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button
              onClick={() => bulkSetActive(true)}
              style={{
                padding: "5px 12px",
                background: "#22c55e22",
                color: "#22c55e",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Set Active
            </button>
            <button
              onClick={() => bulkSetActive(false)}
              style={{
                padding: "5px 12px",
                background: "#eab30822",
                color: "#eab308",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Set Inactive
            </button>
            {bulkDeleteConfirm ? (
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={bulkDelete}
                  style={{
                    padding: "5px 12px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setBulkDeleteConfirm(false)}
                  style={{
                    padding: "5px 12px",
                    background: "#333",
                    color: "#aaa",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                style={{
                  padding: "5px 12px",
                  background: "#ef444422",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

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
                <th style={{ padding: "0.75rem 0.5rem 0.75rem 1rem", fontWeight: 500, width: 36 }}>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: "#c9a84c", width: 16, height: 16, cursor: "pointer" }}
                  />
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}></th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Name
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Category
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Price
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Stock
                </th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                  Badge
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
                  <td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #1f1f1f",
                      transition: "background 0.15s",
                      background: selectedIds.has(p.id) ? "#1e1e1e" : "transparent",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = selectedIds.has(p.id) ? "#252525" : "#222")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = selectedIds.has(p.id) ? "#1e1e1e" : "transparent")
                    }
                  >
                    <td style={{ padding: "0.75rem 0.5rem 0.75rem 1rem" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        style={{ accentColor: "#c9a84c", width: 16, height: 16, cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {p.emoji ? (
                        <span style={{ fontSize: "1.5rem" }}>{p.emoji}</span>
                      ) : p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#555" }}>--</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "#ededed",
                        fontWeight: 500,
                      }}
                    >
                      {p.name}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#aaa" }}>
                      {p.category}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#c9a84c", fontWeight: 600 }}>
                      ₹{p.price.toLocaleString("en-IN")}
                      {p.old_price && (
                        <span
                          style={{
                            color: "#666",
                            textDecoration: "line-through",
                            marginLeft: 6,
                            fontSize: "0.75rem",
                            fontWeight: 400,
                          }}
                        >
                          ₹{p.old_price.toLocaleString("en-IN")}
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
                          background: getStockColor(p) + "22",
                          color: getStockColor(p),
                        }}
                      >
                        {getStockLabel(p)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {p.badge ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            background: "#c9a84c22",
                            color: "#c9a84c",
                          }}
                        >
                          {p.badge}
                        </span>
                      ) : (
                        <span style={{ color: "#555" }}>--</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button
                        onClick={() => toggleActive(p.id, p.is_active)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          background: p.is_active ? "#22c55e22" : "#ef444422",
                          color: p.is_active ? "#22c55e" : "#ef4444",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openEdit(p)}
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
                          Edit
                        </button>
                        {deleteConfirm === p.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{
                                padding: "4px 10px",
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{
                                padding: "4px 10px",
                                background: "#333",
                                color: "#aaa",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            style={{
                              padding: "4px 10px",
                              background: "#ef444422",
                              color: "#ef4444",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.75rem",
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
              Showing {page * PAGE_SIZE + 1}-
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
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

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "2rem",
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: "1.5rem",
              width: "100%",
              maxWidth: 600,
              marginTop: "2rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.25rem",
                color: "#ededed",
                marginBottom: "1.25rem",
              }}
            >
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {/* Name */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Name *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Price */}
              <div>
                <label style={labelStyle}>Price (Rs) *</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  placeholder="1999"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Old Price */}
              <div>
                <label style={labelStyle}>Old Price (Rs)</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.old_price ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      old_price: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  placeholder="2999"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Badge */}
              <div>
                <label style={labelStyle}>Badge</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.badge || ""}
                  onChange={(e) =>
                    setForm({ ...form, badge: e.target.value || null })
                  }
                >
                  <option value="">None</option>
                  {BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Quantity */}
              <div>
                <label style={labelStyle}>Stock Quantity</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm({ ...form, stock_quantity: Number(e.target.value) || 0 })
                  }
                  placeholder="100"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label style={labelStyle}>Low Stock Threshold</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    setForm({ ...form, low_stock_threshold: Number(e.target.value) || 0 })
                  }
                  placeholder="10"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Emoji */}
              <div>
                <label style={labelStyle}>Emoji</label>
                <input
                  style={inputStyle}
                  value={form.emoji || ""}
                  onChange={(e) =>
                    setForm({ ...form, emoji: e.target.value || null })
                  }
                  placeholder="e.g. dress emoji"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Active toggle */}
              <div>
                <label style={labelStyle}>Status</label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    color: "#ccc",
                    fontSize: "0.85rem",
                    marginTop: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    style={{ accentColor: "#c9a84c", width: 16, height: 16 }}
                  />
                  Active
                </label>
              </div>

              {/* Description */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Product description"
                  onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </div>

              {/* Sizes */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Sizes</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: form.sizes.includes(size)
                          ? "1px solid #c9a84c"
                          : "1px solid #2a2a2a",
                        background: form.sizes.includes(size)
                          ? "#c9a84c"
                          : "transparent",
                        color: form.sizes.includes(size) ? "#000" : "#aaa",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: form.sizes.includes(size) ? 600 : 400,
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images - Now using ImageUpload component */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Images</label>
                <ImageUpload
                  images={form.images}
                  onChange={(images) => setForm({ ...form, images })}
                />
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "#222",
                  color: "#aaa",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.price}
                style={{
                  padding: "0.6rem 1.25rem",
                  background:
                    saving || !form.name || !form.price
                      ? "#555"
                      : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  cursor:
                    saving || !form.name || !form.price
                      ? "default"
                      : "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
