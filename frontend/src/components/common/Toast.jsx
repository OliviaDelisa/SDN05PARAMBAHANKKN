import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastIdCounter = 0

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = 'success', duration = 4000) => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev.slice(-2), { id, message, variant }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    remove: removeToast
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// PENTING: hanya pakai warna bawaan Tailwind di sini (emerald, red, sky, dst).
// Warna custom seperti "coral" tidak akan ter-generate kalau belum
// didaftarkan di tailwind.config.js — akibatnya class bg-nya tidak
// menghasilkan CSS apa pun dan toast jadi transparan/tak terlihat.
const VARIANT_STYLES = {
  success: {
    bg: 'bg-emerald-600',
    icon: '✓'
  },
  error: {
    bg: 'bg-red-600',
    icon: '✕'
  },
  info: {
    bg: 'bg-sky-600',
    icon: 'ℹ'
  }
}

function ToastItem({ toast, onRemove }) {
  const v = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3
        ${v.bg} text-white px-4 py-3 rounded-[var(--radius-btn)]
        shadow-lifted animate-toast-in
        min-w-[280px] max-w-[400px]
      `}
    >
      <span className="text-sm font-bold w-5 h-5 flex items-center justify-center shrink-0">
        {v.icon}
      </span>
      <p className="text-[13px] font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/70 hover:text-white text-lg leading-none shrink-0 ml-2"
      >
        ×
      </button>

      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-toast-in {
          animation: toast-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  )
}