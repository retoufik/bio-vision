import React from 'react'
import TubesAnalyzer from '../components/TubesAnalyzer'
import { useTranslation } from 'react-i18next'

export default function TubesPage() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontWeight: 800 }}>{t('biochemicalTests.title')}</h2>
        <p>{t('biochemicalTests.subtitle')}</p>
      </div>
      <TubesAnalyzer />
    </div>
  )
}