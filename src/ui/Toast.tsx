import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; message: string }
const ToastCtx = createContext<{ show: (m: string) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((m: string) => {
    const id = Date.now()
    setToasts(t => [...t, { id, message: m }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', bottom: 16, left: 16, display: 'grid', gap: 8, zIndex: 1000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  return ctx!
}