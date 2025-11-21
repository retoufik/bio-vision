import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isSmall, setIsSmall] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setIsSmall(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
  ]
  if (isSmall) {
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} aria-label="Languages" style={{ width: 36, height: 36, borderRadius: 18, border: '1px solid #ccc', background: '#fff', display: 'grid', placeItems: 'center' }}>
          <span style={{ fontWeight: 800 }}>🌐</span>
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: 40, background: 'var(--app-bg)', color: 'var(--app-fg)', border: '1px solid var(--app-border)', borderRadius: 10, padding: 8, display: 'grid', gap: 6 }}>
            {langs.map(l => (
              <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: i18n.resolvedLanguage === l.code ? '#1f5fff' : '#fff', color: i18n.resolvedLanguage === l.code ? '#fff' : '#333', fontWeight: 600 }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: i18n.resolvedLanguage === l.code ? '#1f5fff' : '#fff',
            color: i18n.resolvedLanguage === l.code ? '#fff' : '#333',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}