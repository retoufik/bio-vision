import React from 'react'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #e5e7eb', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontWeight: 700, color: '#6b7280' }}>Bio Vision</div>
      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#111827' }}>
        <span>Meet Our Team</span>
        <span style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(45deg,#6366f1,#60a5fa,#a855f7)' }} />
      </button>
    </footer>
  )
}