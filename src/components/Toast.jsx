import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

let idCounter = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const id = idCounter++;
    setToasts(t => [...t, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col items-end space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm w-full rounded-md p-3 shadow-lg text-sm text-white ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export default ToastProvider;
