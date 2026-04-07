"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { isValidEmail } from "@/lib/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const fieldConfig = useMemo(
    () => ({
      email: {
        required: true,
        custom: (val: string) =>
          !isValidEmail(val.trim()) ? "Please enter a valid email address" : null,
      },
      password: {
        required: true,
        minLength: 6,
        custom: (val: string) =>
          val.length < 6 ? "Password must be at least 6 characters" : null,
      },
    }),
    []
  );

  const { handleBlur, validateAll, getFieldState } =
    useFormValidation(fieldConfig);

  const getInputBorderColor = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (!state.isTouched) return "#333";
    return state.valid ? "#2ecc71" : "#e74c3c";
  };

  const renderFieldError = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (state.isTouched && state.error) {
      return (
        <span style={{ color: "#e74c3c", fontSize: 12, marginTop: 2 }}>
          {state.error}
        </span>
      );
    }
    return null;
  };

  const renderFieldIndicator = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (!state.isTouched) return null;
    if (state.valid) {
      return (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#2ecc71",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          &#10003;
        </span>
      );
    }
    return null;
  };

  // Translate Supabase error messages
  function translateError(message: string): string {
    if (message.includes("Invalid login credentials")) {
      return "Incorrect email or password. Please try again.";
    }
    if (message.includes("Email not confirmed")) {
      return "Please verify your email before signing in. Check your inbox.";
    }
    if (message.includes("Too many requests")) {
      return "Too many login attempts. Please wait a moment and try again.";
    }
    return message;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isFormValid = validateAll({ email, password });
    if (!isFormValid) return;

    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(translateError(error.message));
      setLoading(false);
    } else {
      router.push("/account");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(translateError(error.message));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome Back</h1>
        <p style={styles.subtext}>Sign in to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={{ position: "relative" as const }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email", email)}
                required
                placeholder="you@example.com"
                style={{
                  ...styles.input,
                  borderColor: getInputBorderColor("email"),
                  paddingRight: 40,
                }}
              />
              {renderFieldIndicator("email")}
            </div>
            {renderFieldError("email")}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" as const }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password", password)}
                required
                placeholder="Your password"
                style={{
                  ...styles.input,
                  borderColor: getInputBorderColor("password"),
                  paddingRight: 40,
                }}
              />
              {renderFieldIndicator("password")}
            </div>
            {renderFieldError("password")}
          </div>

          <div style={{ textAlign: "right", marginTop: "-8px" }}>
            <Link href="/auth/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogleLogin} style={styles.googleBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <p style={styles.bottomText}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" style={styles.link}>
            Create one
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
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box" as const,
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
    transition: "opacity 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#333",
  },
  dividerText: {
    color: "#666",
    fontSize: 13,
  },
  googleBtn: {
    width: "100%",
    padding: "12px",
    background: "#fff",
    color: "#333",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  link: {
    color: "#c9a84c",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
  },
  bottomText: {
    textAlign: "center" as const,
    color: "#888",
    fontSize: 14,
    marginTop: 24,
  },
};
