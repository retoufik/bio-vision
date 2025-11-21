import React, { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light')
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const checked = theme === 'light'
  return (
    <label className={`${styles.switchWrap} ${checked ? styles.checked : ''}`}>
      <input type="checkbox" className={styles.hiddenInput} checked={checked} onChange={e => setTheme(e.target.checked ? 'light' : 'dark')} />
      <div className={styles.track}>
        <div className={styles.thumb} />
      </div>
    </label>
  )
}