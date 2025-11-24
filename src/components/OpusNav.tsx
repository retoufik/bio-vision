import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './OpusNav.module.css'
import GooeyNav from '../menu/gooeyNav'
import { useTranslation } from 'react-i18next'

export default function OpusNav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1130px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  const items = [
    { label: t('navbar.home'), href: '/' },
    { label: t('navbar.colonyAnalyzer'), href: '/analyzer' },
    { label: t('navbar.biochemicalTests'), href: '/tubes' },
  ]
  return (
    <nav className={styles.wrap}>
      <div className={styles.inner}>
        {isNarrow ? (
          <button className={styles.brand} onClick={() => { setOpen(false); setBrandOpen(o => !o) }} aria-haspopup>
            <span style={{ color: '#111827' }}>{t('brand').split(' ')[0]}</span>
            <span className={styles.brandGradient}>{t('brand').split(' ').slice(1).join(' ')}</span>
          </button>
        ) : (
          <Link to="/" className={styles.brand} onClick={() => setOpen(false)}>
            <span style={{ color: '#111827' }}>{t('brand').split(' ')[0]}</span>
            <span className={styles.brandGradient}>{t('brand').split(' ').slice(1).join(' ')}</span>
          </Link>
        )}
       
        <div className={styles.items}>
          <GooeyNav items={items} />
        </div>
        <div className={`${styles.mobileMenu} ${open ? styles.open : ''}`} onClick={() => setOpen(false)}>
          {items.map((it, i) => (
            <Link key={i} to={it.href} className={styles.link} onClick={() => setOpen(false)}>{it.label}</Link>
          ))}
        </div>
        {isNarrow && (
          <div className={`${styles.brandDropdown} ${brandOpen ? styles.brandOpen : ''}`}>
            {items.map((it, i) => (
              <Link key={`b-${i}`} to={it.href} className={styles.link} onClick={() => setBrandOpen(false)}>{it.label}</Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}