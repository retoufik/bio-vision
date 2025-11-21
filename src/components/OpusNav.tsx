import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './OpusNav.module.css'
import GooeyNav from '../menu/gooeyNav'
import { useTranslation } from 'react-i18next'

export default function OpusNav() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const items = [
    { label: t('navbar.home'), href: '/' },
    { label: t('navbar.colonyAnalyzer'), href: '/analyzer' },
    { label: t('navbar.biochemicalTests'), href: '/tubes' },
  ]
  return (
    <nav className={styles.wrap}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} onClick={() => setOpen(o => !o)}>
          <span style={{ color: '#111827' }}>{t('brand').split(' ')[0]}</span>
          <span className={styles.brandGradient}>{t('brand').split(' ').slice(1).join(' ')}</span>
        </Link>
        <div className={styles.items}>
          <GooeyNav items={items} />
        </div>
        <div className={`${styles.mobileMenu} ${open ? styles.open : ''}`}
          onClick={() => setOpen(false)}>
          {items.map((it, i) => (
            <Link key={i} to={it.href} className={styles.link}>{it.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  )
}