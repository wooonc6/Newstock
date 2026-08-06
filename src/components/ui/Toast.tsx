"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

// 다른 컴포넌트에서: const { showToast } = useToast(); showToast("퀴즈 완료!", "success");
export function useToast() {
  return useContext(ToastContext);
}

const TYPE_STYLES: Record<ToastType, { background: string; icon: string }> = {
  success: { background: "var(--accent2)", icon: "✓" },
  error: { background: "var(--danger)", icon: "!" },
  info: { background: "#334155", icon: "i" },
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = idCounter++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "28px",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 999,
          width: "min(92vw, 380px)",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: TYPE_STYLES[toast.type].background,
              color: "#ffffff",
              borderRadius: "14px",
              padding: "14px 16px",
              fontSize: "14px",
              fontWeight: 600,
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.2)",
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {TYPE_STYLES[toast.type].icon}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
