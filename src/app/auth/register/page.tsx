"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  getPasswordStrength,
} from "@/lib/validation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const fieldConfig = useMemo(
    () => ({
      fullName: {
        required: true,
        minLength: 2,
        custom: (val: string) =>
          !isValidName(val) ? "Name must be at least 2 characters with no numbers" : null,
      },
      email: {
        required: true,
        custom: (val: string) =>
          !isValidEmail(val.trim()) ? "Please enter a valid email address" : null,
      },
      password: {
        required: true,
        custom: (val: string) => {
          const result = isValidPassword(val);
          return result.valid ? null : result.errors[0];
        },
      },
      confirmPassword: {
        required: true,
        custom: (val: string) =>
          val !== password ? "Passwords do not match" : null,
      },
    }),
    [password]
  );

  const { errors, handleBlur, validateAll, getFieldState } =
    useFormValidation(fieldConfig);

  const passwordResult = isValidPassword(password);
  const passwordStrength = getPasswordStrength(password);

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const strengthColor =
    passwordStrength === "strong"
      ? "#2ecc71"
      : passwordStrength === "medium"
        ? "#f39c12"
        : "#e74c3c";

  const strengthWidth =
    passwordStrength === "strong"
      ? "100%"
      : passwordStrength === "medium"
        ? "60%"
        : "30%";

  const allFieldsValid =
    isValidName(fullName) &&
    isValidEmail(email.trim()) &&
    passwordResult.valid &&
    confirmPassword === password &&
    confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isFormValid = validateAll({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!isFormValid) return;

    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const renderFieldIndicator = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (!state.isTouched) return null;
    if (state.valid) {
      return <span style={styles.validIcon}>&#10003;</span>;
    }
    return null;
  };

  const renderFieldError = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (state.isTouched && state.error) {
      return <span style={styles.fieldError}>{state.error}</span>;
    }
    return null;
  };

  const getInputBorderColor = (fieldName: string) => {
    const state = getFieldState(fieldName);
    if (!state.isTouched) return "#333";
    return state.valid ? "#2ecc71" : "#e74c3c";
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center" }}>
            <div style={styles.successIcon}>&#10003;</div>
            <h1 style={styles.heading}>Check Your Email</h1>
            <p style={{ color: "#999", marginTop: 12, lineHeight: 1.6 }}>
              We&apos;ve sent a verification link to <strong style={{ color: "#c9a84c" }}>{email}</strong>.
              Please check your inbox and click the link to verify your account.
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
        <h1 style={styles.heading}>Create Account</h1>
        <p style={styles.subtext}>Join the world of luxury fashion</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur("fullName", fullName)}
                required
                placeholder="Your full name"
                style={{
                  ...styles.input,
                  borderColor: getInputBorderColor("fullName"),
                }}
              />
              {renderFieldIndicator("fullName")}
            </div>
            {renderFieldError("fullName")}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
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
                }}
              />
              {renderFieldIndicator("email")}
            </div>
            {renderFieldError("email")}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password", password)}
                required
                placeholder="Min. 8 characters"
                style={{
                  ...styles.input,
                  borderColor: getInputBorderColor("password"),
                }}
              />
              {renderFieldIndicator("password")}
            </div>
            {renderFieldError("password")}

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={styles.strengthBarBg}>
                  <div
                    style={{
                      ...styles.strengthBarFill,
                      width: strengthWidth,
                      background: strengthColor,
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: strengthColor, marginTop: 4, textTransform: "capitalize" }}>
                  {passwordStrength}
                </p>

                {/* Password Requirements Checklist */}
                <div style={{ marginTop: 8 }}>
                  {passwordChecks.map((check) => (
                    <div key={check.label} style={styles.checkItem}>
                      <span
                        style={{
                          color: check.met ? "#2ecc71" : "#666",
                          fontSize: 14,
                          marginRight: 6,
                        }}
                      >
                        {check.met ? "\u2713" : "\u2717"}
                      </span>
                      <span style={{ fontSize: 12, color: check.met ? "#aaa" : "#666" }}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                required
                placeholder="Re-enter password"
                style={{
                  ...styles.input,
                  borderColor: getInputBorderColor("confirmPassword"),
                }}
              />
              {renderFieldIndicator("confirmPassword")}
            </div>
            {renderFieldError("confirmPassword")}
          </div>

          <button
            type="submit"
            disabled={loading || !allFieldsValid}
            style={{
              ...styles.primaryBtn,
              opacity: loading || !allFieldsValid ? 0.5 : 1,
              cursor: loading || !allFieldsValid ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogleSignup} style={styles.googleBtn}>
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
          Sign up with Google
        </button>

        <p style={styles.bottomText}>
          Already have an account?{" "}
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
  inputWrapper: {
    position: "relative" as const,
  },
  input: {
    padding: "12px 40px 12px 14px",
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
  validIcon: {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#2ecc71",
    fontSize: 16,
    fontWeight: 700,
  },
  fieldError: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 2,
  },
  strengthBarBg: {
    height: 4,
    background: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s, background 0.3s",
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: 2,
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
