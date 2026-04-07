"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLog";
import { useAuth } from "@/contexts/AuthContext";

interface ConfigEntry {
  id?: string;
  key: string;
  value: string;
}

const SECTIONS = [
  {
    title: "Brand Settings",
    fields: [
      { key: "brand_name", label: "Brand Name", placeholder: "Robins Luxe Threads" },
      { key: "tagline", label: "Tagline", placeholder: "Luxury Women's Fashion" },
      { key: "year_founded", label: "Year Founded", placeholder: "2024" },
    ],
  },
  {
    title: "Contact Information",
    fields: [
      { key: "whatsapp", label: "WhatsApp Number", placeholder: "+91 98765 43210" },
      { key: "email", label: "Contact Email", placeholder: "hello@example.com" },
      { key: "phone", label: "Phone Number", placeholder: "+91 98765 43210" },
      { key: "address", label: "Address", placeholder: "City, State, India" },
    ],
  },
  {
    title: "Currency Settings",
    fields: [
      { key: "currency_code", label: "Currency Code", placeholder: "INR" },
      { key: "currency_symbol", label: "Currency Symbol", placeholder: "₹" },
    ],
  },
  {
    title: "Social Media",
    fields: [
      { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/..." },
      { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/..." },
    ],
  },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const adminEmail = user?.email || "admin";
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data } = await supabase.from("site_config").select("*");
    const map: Record<string, string> = {};
    (data || []).forEach((row: ConfigEntry) => {
      map[row.key] = row.value;
    });
    setConfig(map);
    setLoading(false);
  }

  function updateField(key: string, value: string) {
    setConfig({ ...config, [key]: value });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upsert all config values
      const entries = Object.entries(config)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([key, value]) => ({ key, value }));

      for (const entry of entries) {
        const { error } = await supabase
          .from("site_config")
          .upsert(entry, { onConflict: "key" });
        if (error) throw error;
      }

      await logActivity(adminEmail, "updated", "settings", undefined, { keys: Object.keys(config) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Error saving: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

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
          Site Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.6rem 1.5rem",
            background: saved
              ? "#22c55e"
              : saving
              ? "#555"
              : "linear-gradient(135deg, #c9a84c, #d4b96a)",
            color: saved ? "#fff" : "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            fontSize: "0.85rem",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.2s",
          }}
        >
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          maxWidth: 700,
        }}
      >
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem",
                color: "#c9a84c",
                marginBottom: "1rem",
              }}
            >
              {section.title}
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      color: "#aaa",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    style={inputStyle}
                    value={config[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "#c9a84c")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "#2a2a2a")
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
