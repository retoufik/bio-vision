import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light')
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #e5e7eb', fontWeight: 700 }}>
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  )
}