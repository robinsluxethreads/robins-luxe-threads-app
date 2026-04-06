"use client";

import { useState, useCallback } from "react";
import Toast from "@/components/Toast";

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

export default function ContactPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setForm({ first_name: "", last_name: "", email: "", subject: SUBJECTS[0], message: "" });
      } else {
        setToast({ show: true, message: data.error || "Failed to send message", isError: true });
      }
    } catch {
      setToast({ show: true, message: "Network error. Please try again.", isError: true });
    } finally {
      setLoading(false);
    }
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
                      className="input-dark"
                      placeholder="John"
                      required
                    />
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
                      className="input-dark"
                      placeholder="Doe"
                      required
                    />
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
                    className="input-dark"
                    placeholder="john@example.com"
                    required
                  />
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
                  <label className="block text-sm mb-1" style={{ color: "#999" }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    className="input-dark"
                    rows={5}
                    placeholder="How can we help you?"
                    required
                    style={{ resize: "vertical" }}
                  />
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
