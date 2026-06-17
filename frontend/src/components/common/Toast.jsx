import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

let toastCount = 0;
let addToastHandler = null;

export const toast = {
  success: (message) => addToastHandler?.(message, "success"),
  error: (message) => addToastHandler?.(message, "error"),
  info: (message) => addToastHandler?.(message, "info"),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastHandler = (message, type) => {
      const id = toastCount++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastHandler = null;
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle2 size={16} className="text-[#2ecc71]" />;
      case "error": return <AlertCircle size={16} className="text-[#e74c3c]" />;
      default: return <Info size={16} className="text-[#3498db]" />;
    }
  };

  return (
    <div className="fixed top-20 right-8 z-[3000] flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#2c2c2c] border border-[#404040] rounded-lg shadow-xl animate-in slide-in-from-right fade-in duration-200 min-w-[280px]"
        >
          <div className="flex-shrink-0">{getIcon(t.type)}</div>
          <div className="flex-1 text-[0.9rem] font-medium text-[#eff1f6]">{t.message}</div>
          <button 
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
