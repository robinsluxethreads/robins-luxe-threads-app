"use client";

import { useState, useCallback } from "react";
import Toast from "@/components/Toast";
import { isValidEmail, isValidName } from "@/lib/validation";

const SUBJECTS = [
  "General Inquiry",
  "Product Question",
  "Order Status",
  "Returns & Exchanges",
  "Collaboration",
  "Other",
];

const contactInfo = [
  {
    icon: "📍",
    title: "Visit Us",
    lines: ["Chennai, Tamil Nadu", "India"],
  },
  {
    icon: "📧",
    title: "Email Us",
    lines: ["robinsluxethreads@gmail.com"],
  },
  {
    icon: "📞",
    title: "Call Us",
    lines: ["+91 90252 56341"],
  },
  {
    icon: "🕐",
    title: "Store Hours",
    lines: ["Mon - Sat: 10AM - 8PM", "Sunday: 11AM - 6PM"],
  },
];

interface FieldErrors {
  [key: string]: string;
}

export default function ContactPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
    website: "", // honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "first_name":
        if (!value.trim()) return "First name is required";
        if (!isValidName(value)) return "Min 2 chars, no numbers";
        return "";
      case "last_name":
        if (!value.trim()) return "Last name is required";
        if (!isValidName(value)) return "Min 2 chars, no numbers";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!isValidEmail(value.trim())) return "Enter a valid email address";
        return "";
      case "message":
        if (!value.trim()) return "Message is required";
        if (value.trim().length < 10) return "Message must be at least 10 characters";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const fields = ["first_name", "last_name", "email", "message"];
    const newErrors: FieldErrors = {};
    const newTouched: Record<string, boolean> = {};
    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: "Message sent successfully!", isError: false });
        setForm({ first_name: "", last_name: "", email: "", subject: SUBJECTS[0], message: "", website: "" });
        setFieldErrors({});
        setTouched({});
      } else {
        setToast({ show: true, message: data.error || "Failed to send message", isError: true });
      }
    } catch {
      setToast({ show: true, message: "Network error. Please try again.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (name: string): string => {
    if (!touched[name]) return "input-dark";
    if (fieldErrors[name]) return "input-dark";
    return "input-dark";
  };

  const getInputStyle = (name: string): React.CSSProperties => {
    if (!touched[name]) return {};
    if (fieldErrors[name]) return { borderColor: "#e74c3c" };
    return { borderColor: "#2ecc71" };
  };

  return (
    <>
      {/* Banner */}
      <div className="page-banner">
        <h1
          className="gradient-text"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Get in Touch
        </h1>
        <div className="divider" />
        <p style={{ color: "#888" }}>
          We&apos;d love to hear from you
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="fade-in">
            <div
              className="p-6 sm:p-8 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <h2
                className="text-xl font-bold mb-6 text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field - hidden from real users */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#999" }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("first_name", form.first_name)}
                      className={getInputClass("first_name")}
                      style={getInputStyle("first_name")}
                      placeholder="John"
                      required
                    />
                    {touched.first_name && fieldErrors.first_name && (
                      <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 4 }}>{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "#999" }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("last_name", form.last_name)}
                      className={getInputClass("last_name")}
                      style={getInputStyle("last_name")}
                      placeholder="Doe"
                      required
                    />
                    {touched.last_name && fieldErrors.last_name && (
                      <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 4 }}>{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#999" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email", form.email)}
                    className={getInputClass("email")}
                    style={getInputStyle("email")}
                    placeholder="john@example.com"
                    required
                  />
                  {touched.email && fieldErrors.email && (
                    <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 4 }}>{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "#999" }}>
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="input-dark"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="block text-sm mb-1" style={{ color: "#999" }}>
                      Message
                    </label>
                    <span style={{ color: form.message.length >= 10 ? "#2ecc71" : "#666", fontSize: 12 }}>
                      {form.message.length}/500
                    </span>
                  </div>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) handleChange(e);
                    }}
                    onBlur={() => handleBlur("message", form.message)}
                    className={getInputClass("message")}
                    style={{ ...getInputStyle("message"), resize: "vertical" as const }}
                    rows={5}
                    placeholder="How can we help you? (min 10 characters)"
                    required
                    maxLength={500}
                  />
                  {touched.message && fieldErrors.message && (
                    <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 4 }}>{fieldErrors.message}</p>
                  )}
                </div>
                <button type="submit" className="btn-gold w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info) => (
                <div key={info.title} className="contact-info-card">
                  <div className="text-3xl mb-3">{info.icon}</div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#c9a84c",
                    }}
                  >
                    {info.title}
                  </h3>
                  {info.lines.map((line, i) => (
                    <p key={i} className="text-sm" style={{ color: "#888" }}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={closeToast}
        isError={toast.isError}
      />
    </>
  );
}
