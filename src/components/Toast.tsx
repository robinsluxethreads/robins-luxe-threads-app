"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  isError?: boolean;
}

export default function Toast({ message, show, onClose, isError = false }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${visible ? "show" : ""} ${isError ? "toast-error" : ""}`}>
        {message}
      </div>
    </div>
  );
}
