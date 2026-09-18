import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from "lucide-react";

let toastCount = 0;
let addToastHandler = null;
let dismissToastHandler = null;

export const toast = {
  success: (message) => addToastHandler?.(message, "success"),
  error: (message) => addToastHandler?.(message, "error"),
  info: (message) => addToastHandler?.(message, "info"),
  loading: (message = "Loading...") => addToastHandler?.(message, "loading"),
  dismiss: (id) => dismissToastHandler?.(id),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastHandler = (message, type) => {
      const id = toastCount++;
      const isLoad = type === "loading" || (typeof message === "string" && message.toLowerCase().startsWith("loading"));
      const actualType = isLoad ? "loading" : type;
      
      setToasts((prev) => [...prev, { id, message, type: actualType }]);
      
      // Auto-dismiss non-loading toasts after 4.5s; loading toasts persist until dismissed or 8s max
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, actualType === "loading" ? 8000 : 4500);

      return id;
    };

    dismissToastHandler = (id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return () => {
      addToastHandler = null;
      dismissToastHandler = null;
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="text-[#2ecc71]" style={{ color: "#2ecc71" }} />;
      case "error":
        return <AlertCircle size={18} className="text-[#e74c3c]" style={{ color: "#e74c3c" }} />;
      case "loading":
        return (
          <div className="toast-loading-spinner-wrap">
            <Loader2 size={18} className="anim-spin toast-loader-icon" />
          </div>
        );
      default:
        return <Info size={18} className="text-[#3498db]" style={{ color: "#3498db" }} />;
    }
  };

  return (
    <div className="toast-container-root" aria-live="polite">
      {toasts.map((t) => {
        const isLoading = t.type === "loading";
        return (
          <div
            key={t.id}
            className={`toast-item toast-item-${t.type || "info"}`}
            role="alert"
          >
            <div className="toast-icon-wrap">{getIcon(t.type)}</div>
            <div className="toast-message">
              {t.message}
            </div>
            {!isLoading && (
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="toast-close-btn"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            )}
            {isLoading && (
              <div className="toast-loading-bar-track">
                <div className="toast-loading-bar-fill" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
