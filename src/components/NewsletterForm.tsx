"use client";

import { useState, useCallback } from "react";
import Toast from "./Toast";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setToast({ show: true, message: "Successfully subscribed!", isError: false });
        setEmail("");
      } else {
        setToast({ show: true, message: data.error || "Something went wrong", isError: true });
      }
    } catch {
      setToast({ show: true, message: "Network error. Please try again.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="input-dark flex-1"
          required
        />
        <button type="submit" className="btn-gold whitespace-nowrap" disabled={loading}>
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
      <Toast
        message={toast.message}
        show={toast.show}
        onClose={closeToast}
        isError={toast.isError}
      />
    </>
  );
}
