import React, { useMemo, useState } from 'react'
import styles from './Home.module.css'
import { useTranslation } from 'react-i18next'

type GalleryItem = { id: string; src: string }

export default function Home() {
  const { t } = useTranslation('common')
  const [activeId, setActiveId] = useState<GalleryItem['id'] | null>(null)
  const items: GalleryItem[] = useMemo(() => {
    const ctx = (require as any).context('../assest', false, /\.(png|jpe?g|gif)$/)
    return ctx.keys().map((k: string) => ({ id: k, src: ctx(k) }))
  }, [])
  const cols = [[], [], []] as GalleryItem[][]
  items.forEach((it, i) => cols[i % 3].push(it))
  const [left, center, right] = cols

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>{t('gallery.heading')}</h1>
        <span className={styles.badge}>{t('brand')}</span>
      </div>
      <div className={`${styles.galleryLayout} ${activeId ? styles.pausedAll : ''}`}>
        <div className={styles.column}>
        <div className={styles.track}>
        {left.map((it, idx) => {
          const focused = activeId === it.id
          const paused = activeId !== null && !focused
          return (
            <article key={`${it.id}-${idx}`} className={`${styles.card} ${styles.cardMove} ${focused ? styles.focused : ''} ${paused ? styles.paused : ''}`}>
              <div
                className={styles.imgWrap}
                onClick={() => setActiveId(it.id)}
              >
                <img className={styles.img} src={it.src} alt={t('gallery.generic.title')} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2' }} />
              </div>
            </article>
          )
        })}
        </div>
        </div>
        <div className={styles.center}>
        <div className={`${styles.track}`}>
        {center.map((it, idx) => {
          const focused = activeId === it.id
          const paused = activeId !== null && !focused
          return (
            <article key={`${it.id}-${idx}`} className={`${styles.card} ${styles.cardMove} ${styles.big} ${focused ? styles.focused : ''} ${paused ? styles.paused : ''}`}>
              <div
                className={styles.imgWrap}
                onClick={() => setActiveId(it.id)}
              >
                <img className={styles.img} src={it.src} alt={t('gallery.generic.title')} />
              </div>
            </article>
          )
        })}
        </div>
        </div>
        <div className={styles.column}>
        <div className={styles.track}>
        {right.map((it, idx) => {
          const focused = activeId === it.id
          const paused = activeId !== null && !focused
          return (
            <article key={`${it.id}-${idx}`} className={`${styles.card} ${styles.cardMove} ${focused ? styles.focused : ''} ${paused ? styles.paused : ''}`}>
              <div
                className={styles.imgWrap}
                onClick={() => setActiveId(it.id)}
              >
                <img className={styles.img} src={it.src} alt={t('gallery.generic.title')} />
              </div>
            </article>
          )
        })}
        </div>
        </div>
      </div>
      {activeId && (() => {
        const it = items.find(i => i.id === activeId)
        if (!it) return null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }} onClick={() => setActiveId(null)}>
            <div style={{ maxWidth: '90vw', maxHeight: '85vh', background: 'var(--app-bg)', color: 'var(--app-fg)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--app-border)' }}>
              <img src={it.src} alt={t('gallery.generic.title')} style={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}