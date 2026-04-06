"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAILS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
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

  if (!user) {
    return null;
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ededed",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2rem",
            marginBottom: "0.5rem",
            color: "#c9a84c",
          }}
        >
          Access Denied
        </h1>
        <p style={{ color: "#888", maxWidth: 400, marginBottom: "2rem" }}>
          You do not have permission to access the admin dashboard. This area is
          restricted to authorized administrators only.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "0.75rem 2rem",
            background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
