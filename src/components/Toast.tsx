"use client";

import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  isError?: boolean;
}

let toastIdCounter = 0;

// Global toast stack for stacking multiple toasts
const toastListeners: Set<(toast: ToastItem) => void> = new Set();

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastItem = {
    id: ++toastIdCounter,
    message,
    type,
    visible: true,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (toast: ToastItem) => {
      setToasts((prev) => [...prev.slice(-4), toast]); // Max 5 toasts

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === toast.id ? { ...t, visible: false } : t))
        );
        // Remove from DOM after animation
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 400);
      }, 3000);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case "error":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "info":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const getBackground = (type: ToastType) => {
    switch (type) {
      case "success":
        return "linear-gradient(135deg, #2ecc71, #27ae60)";
      case "error":
        return "linear-gradient(135deg, #ef4444, #dc2626)";
      case "info":
        return "linear-gradient(135deg, #c9a84c, #d4b96a)";
    }
  };

  const getTextColor = (type: ToastType) => {
    return type === "info" ? "#0a0a0a" : "#fff";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            color: getTextColor(toast.type),
            background: getBackground(toast.type),
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            transform: toast.visible ? "translateX(0)" : "translateX(120%)",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            maxWidth: 350,
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "auto",
          }}
        >
          {getIcon(toast.type)}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// Backward-compatible Toast component for existing usage
export default function Toast({ message, show, onClose, isError = false }: ToastProps) {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(handleClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, handleClose]);

  if (!show && !visible) return null;

  const type: ToastType = isError ? "error" : "success";

  const getIcon = () => {
    if (isError) {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 500,
          color: type === "error" ? "#fff" : "#0a0a0a",
          background:
            type === "error"
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #2ecc71, #27ae60)",
          boxShadow:
            type === "error"
              ? "0 10px 30px rgba(239, 68, 68, 0.3)"
              : "0 10px 30px rgba(46, 204, 113, 0.3)",
          transform: visible ? "translateX(0)" : "translateX(120%)",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          maxWidth: 350,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {getIcon()}
        {message}
      </div>
    </div>
  );
}
