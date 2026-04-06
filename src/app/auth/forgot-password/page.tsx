"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={styles.successIcon}>&#9993;</div>
            <h1 style={styles.heading}>Check Your Email</h1>
            <p style={{ color: "#999", marginTop: 12, lineHeight: 1.6 }}>
              We&apos;ve sent a password reset link to{" "}
              <strong style={{ color: "#c9a84c" }}>{email}</strong>. Please check your inbox and
              follow the instructions.
            </p>
            <Link href="/auth/login" style={styles.backLink}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Forgot Password</h1>
        <p style={styles.subtext}>
          Enter your email and we&apos;ll send you a link to reset your password
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Remember your password?{" "}
          <Link href="/auth/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 450,
    padding: "40px 32px",
    background: "#111111",
    borderRadius: 12,
    border: "1px solid #222",
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    color: "#c9a84c",
    textAlign: "center" as const,
    margin: 0,
  },
  subtext: {
    textAlign: "center" as const,
    color: "#999",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 1.5,
  },
  error: {
    background: "rgba(231, 76, 60, 0.15)",
    border: "1px solid #e74c3c",
    color: "#e74c3c",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    margin: "0 auto 20px",
    border: "2px solid #2ecc71",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#bbb",
    fontWeight: 500,
  },
  input: {
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
  },
  primaryBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  link: {
    color: "#c9a84c",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
  },
  backLink: {
    display: "inline-block",
    marginTop: 24,
    color: "#c9a84c",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: 15,
  },
  bottomText: {
    textAlign: "center" as const,
    color: "#888",
    fontSize: 14,
    marginTop: 24,
  },
};
