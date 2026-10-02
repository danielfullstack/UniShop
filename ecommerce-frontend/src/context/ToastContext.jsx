import React, { createContext, useCallback, useMemo, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components -- The context and its provider belong together.
export const ToastContext = createContext();

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, options = {}) => {
    if (!message) return () => {};
    const id = ++toastIdCounter;
    const { type = "info", timeout = 3500 } = options;
    setToasts((current) => [
      ...current,
      {
        id,
        type,
        message,
        createdAt: Date.now(),
      },
    ]);
    if (timeout > 0) {
      setTimeout(() => removeToast(id), timeout);
    }
    return () => removeToast(id);
  }, [removeToast]);

  const contextValue = useMemo(
    () => ({ notify, removeToast }),
    [notify, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Cerrar notificación">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
