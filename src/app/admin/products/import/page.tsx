"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface ParsedProduct {
  name: string;
  price: number;
  old_price: number | null;
  category: string;
  description: string;
  sizes: string[];
  badge: string | null;
  emoji: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
}

function parseCSV(text: string): ParsedProduct[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const products: ParsedProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const name = row["name"] || "";
    const price = parseFloat(row["price"] || "0");
    const category = row["category"] || "";

    if (!name || !price || !category) continue;

    const sizesRaw = row["sizes"] || "";
    const sizes = sizesRaw
      ? sizesRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : [];

    products.push({
      name,
      price,
      old_price: row["old_price"] ? parseFloat(row["old_price"]) : null,
      category,
      description: row["description"] || "",
      sizes,
      badge: row["badge"] || null,
      emoji: row["emoji"] || null,
      stock_quantity: row["stock_quantity"] ? parseInt(row["stock_quantity"]) : 100,
      low_stock_threshold: row["low_stock_threshold"] ? parseInt(row["low_stock_threshold"]) : 10,
    });
  }

  return products;
}

export default function ImportProductsPage() {
  const { user } = useAuth();
  const adminEmail = user?.email || "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const products = parseCSV(text);
      setParsed(products);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: parsed, adminEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ successCount: 0, errorCount: parsed.length, errors: [data.error || "Import failed"] });
      } else {
        setResult({
          successCount: data.successCount,
          errorCount: data.errorCount,
          errors: data.errors || [],
        });
      }
    } catch {
      setResult({ successCount: 0, errorCount: parsed.length, errors: ["Network error"] });
    } finally {
      setImporting(false);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    fontWeight: 500,
    color: "#888",
    textAlign: "left",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    color: "#ccc",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", color: "#ededed", margin: 0 }}>
          Import Products
        </h1>
        <Link
          href="/admin/products"
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            color: "#c9a84c",
            border: "1px solid #c9a84c",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          Back to Products
        </Link>
      </div>

      {/* CSV Format Info */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          fontSize: "0.8rem",
          color: "#888",
        }}
      >
        <strong style={{ color: "#c9a84c" }}>CSV Format:</strong> name, price, old_price, category, description, sizes, badge, emoji, stock_quantity, low_stock_threshold
        <br />
        <span style={{ color: "#666" }}>Sizes should be comma-separated (e.g. S,M,L). Required fields: name, price, category.</span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#c9a84c" : "#2a2a2a"}`,
          borderRadius: 12,
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(201,168,76,0.05)" : "#1a1a1a",
          transition: "all 0.2s",
          marginBottom: "1.5rem",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
        <p style={{ color: "#aaa", fontSize: "0.9rem", margin: "0 0 4px" }}>
          {fileName || "Drag & drop a CSV file here, or click to browse"}
        </p>
        <p style={{ color: "#666", fontSize: "0.75rem", margin: 0 }}>
          Only .csv files accepted
        </p>
      </div>

      {/* Preview Table */}
      {parsed.length > 0 && !result && (
        <>
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#ccc", fontSize: "0.9rem" }}>
              {parsed.length} product{parsed.length !== 1 ? "s" : ""} found
              {parsed.length > 10 && " (showing first 10)"}
            </span>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                padding: "0.6rem 1.5rem",
                background: importing ? "#555" : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: importing ? "default" : "pointer",
                fontSize: "0.85rem",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {importing ? "Importing..." : `Import ${parsed.length} Product${parsed.length !== 1 ? "s" : ""}`}
            </button>
          </div>

          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Old Price</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Sizes</th>
                    <th style={thStyle}>Badge</th>
                    <th style={thStyle}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 10).map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1f1f1f" }}>
                      <td style={{ ...tdStyle, color: "#666" }}>{i + 1}</td>
                      <td style={{ ...tdStyle, color: "#ededed", fontWeight: 500 }}>{p.name}</td>
                      <td style={{ ...tdStyle, color: "#c9a84c" }}>Rs {p.price}</td>
                      <td style={tdStyle}>{p.old_price ? `Rs ${p.old_price}` : "--"}</td>
                      <td style={tdStyle}>{p.category}</td>
                      <td style={tdStyle}>{p.sizes.join(", ") || "--"}</td>
                      <td style={tdStyle}>{p.badge || "--"}</td>
                      <td style={tdStyle}>{p.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Import Progress / Result */}
      {importing && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #2a2a2a",
              borderTopColor: "#c9a84c",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#888" }}>Importing products...</p>
        </div>
      )}

      {result && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#ededed", fontSize: "1.1rem", marginBottom: "1rem" }}>
            Import Complete
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
            <div>
              <span style={{ color: "#2ecc71", fontSize: "1.5rem", fontWeight: 700 }}>{result.successCount}</span>
              <p style={{ color: "#888", fontSize: "0.8rem", margin: "4px 0 0" }}>Imported</p>
            </div>
            {result.errorCount > 0 && (
              <div>
                <span style={{ color: "#e74c3c", fontSize: "1.5rem", fontWeight: 700 }}>{result.errorCount}</span>
                <p style={{ color: "#888", fontSize: "0.8rem", margin: "4px 0 0" }}>Errors</p>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div style={{ background: "#111", borderRadius: 8, padding: "0.75rem", maxHeight: 200, overflowY: "auto" }}>
              {result.errors.map((err, i) => (
                <p key={i} style={{ color: "#e74c3c", fontSize: "0.8rem", margin: "4px 0" }}>
                  {err}
                </p>
              ))}
            </div>
          )}
          <div style={{ marginTop: "1rem" }}>
            <Link
              href="/admin/products"
              style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
                color: "#000",
                border: "none",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              View Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
