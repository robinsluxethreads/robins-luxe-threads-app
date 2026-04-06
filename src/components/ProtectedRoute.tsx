"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={spinnerStyles.wrapper}>
          <div style={spinnerStyles.spinner} />
          <p style={{ color: "#999", marginTop: 16, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

const spinnerStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    textAlign: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #222",
    borderTop: "3px solid #c9a84c",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
};
