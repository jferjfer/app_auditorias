import React, { useState, useEffect } from 'react';

let toastId = 0;
let showToastFn = null;

export const toast = {
  success: (msg) => showToastFn?.(msg, 'success'),
  error: (msg) => showToastFn?.(msg, 'error'),
  info: (msg) => showToastFn?.(msg, 'info'),
  warning: (msg) => showToastFn?.(msg, 'warning')
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFn = (msg, type) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
  }, []);

  const colors = {
    success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  };

  return (
    <div style={{position: 'fixed', top: '70px', right: '20px', zIndex: 9999, maxWidth: '350px'}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: colors[t.type],
          color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '10px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease-out',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
