import React from 'react'

export default function OpusHero() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, padding: '16px 0' }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111827' }}>
          Powering A <span style={{ color: '#6366f1' }}>New Era</span> Of Genetic Medicines
        </h1>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Through our Advanced LNP Platform</h2>
        <p style={{ color: '#374151', maxWidth: 640 }}>
          Inspired by the Opus hero, this CRA port uses simple CSS modules and inline styles to recreate the feel.
        </p>
        
      </div>
    </section>
  )
}