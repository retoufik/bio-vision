import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
  ]
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