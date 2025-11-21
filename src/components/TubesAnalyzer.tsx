import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

type TestResult = 'positive' | 'negative' | 'unknown'

type BiochemicalTest = {
  name: string
  shortName: string
  result: TestResult
  positiveColor: string
  negativeColor: string
  positiveDescription: string
  negativeDescription: string
  photo?: string
}

const TESTS_CONFIG: Record<string, Omit<BiochemicalTest, 'result' | 'photo'>> = {
  gramStain: { name: 'Gram Stain', shortName: 'Gram', positiveColor: '#9370DB', negativeColor: '#FF6B6B', positiveDescription: 'Purple (Gram+)', negativeDescription: 'Pink/Red (Gram-)' },
  catalase: { name: 'Catalase', shortName: 'CAT', positiveColor: '#FFD93D', negativeColor: '#E8E8E8', positiveDescription: 'Bubbles (Positive)', negativeDescription: 'No Bubbles (Negative)' },
  oxidase: { name: 'Oxidase', shortName: 'OX', positiveColor: '#7B68EE', negativeColor: '#CCCCCC', positiveDescription: 'Purple/Black (Positive)', negativeDescription: 'Colorless (Negative)' },
  coagulase: { name: 'Coagulase', shortName: 'COA', positiveColor: '#FF4757', negativeColor: '#F5F5F5', positiveDescription: 'Clotted (Positive)', negativeDescription: 'Clear (Negative)' },
  indole: { name: 'Indole', shortName: 'IND', positiveColor: '#E84393', negativeColor: '#F0F0F0', positiveDescription: 'Red Ring (Positive)', negativeDescription: 'No Color (Negative)' },
  citrate: { name: 'Citrate', shortName: 'CIT', positiveColor: '#00D2D3', negativeColor: '#F5F5F5', positiveDescription: 'Blue/Green (Positive)', negativeDescription: 'No Color (Negative)' },
  urease: { name: 'Urease', shortName: 'URS', positiveColor: '#FF9F1C', negativeColor: '#F5F5F5', positiveDescription: 'Pink/Orange (Positive)', negativeDescription: 'Yellow (Negative)' },
  lactoseFermentation: { name: 'Lactose Fermentation', shortName: 'LAC', positiveColor: '#FFB6C1', negativeColor: '#F0F0F0', positiveDescription: 'Red/Pink (Acid)', negativeDescription: 'No Color (Negative)' },
}

type BacteriaResult = { name: string; confidence: number; characteristics: string[]; explanation: string; commonIn: string }

const BACTERIA: Record<string, Omit<BacteriaResult, 'confidence'>> = {
  'Staphylococcus aureus': { name: 'Staphylococcus aureus', characteristics: ['Gram+', 'Catalase+', 'Coagulase+', 'Golden colonies'], explanation: 'Gram-positive cocci, catalase and coagulase positive. Common food poisoning pathogen.', commonIn: 'Dairy, cheese, processed foods, skin infections' },
  'E. coli': { name: 'Escherichia coli', characteristics: ['Gram-', 'Oxidase-', 'Indole+', 'Lactose+'], explanation: 'Gram-negative rod, oxidase negative, indole positive. Common in food and water.', commonIn: 'Water, dairy, meat, fecal samples' },
  'Salmonella': { name: 'Salmonella species', characteristics: ['Gram-', 'Catalase+', 'Citrate+', 'No lactose fermentation'], explanation: 'Gram-negative rod, catalase positive, citrate positive, no lactose fermentation.', commonIn: 'Meat, poultry, eggs, food poisoning' },
  'Listeria monocytogenes': { name: 'Listeria monocytogenes', characteristics: ['Gram+', 'Catalase+', 'Coagulase-', 'β-hemolytic'], explanation: 'Gram-positive rod, catalase positive, coagulase negative. Important dairy pathogen.', commonIn: 'Dairy, meat, fermented foods' },
  'Pseudomonas aeruginosa': { name: 'Pseudomonas aeruginosa', characteristics: ['Gram-', 'Oxidase+', 'Green pigment', 'Non-fermenting'], explanation: 'Gram-negative rod, oxidase positive. Often produces green-blue pigment.', commonIn: 'Water, soil, environmental samples' },
  'Lactobacillus': { name: 'Lactobacillus species', characteristics: ['Gram+', 'Catalase-', 'Lactose+', 'Homofermentative'], explanation: 'Gram-positive rod, catalase negative. Essential in fermentation.', commonIn: 'Fermented dairy, yogurt, kimchi' },
}

export default function TubesAnalyzer() {
  const { t } = useTranslation()
  const [tests, setTests] = useState<Record<string, BiochemicalTest>>(
    Object.entries(TESTS_CONFIG).reduce((acc, [key, cfg]) => {
      acc[key] = { ...cfg, result: 'unknown', photo: undefined }
      return acc
    }, {} as Record<string, BiochemicalTest>)
  )
  const [result, setResult] = useState<BacteriaResult | null>(null)

  const setResultFor = (key: string, r: TestResult) => setTests(prev => ({ ...prev, [key]: { ...prev[key], result: r } }))
  const uploadPhoto = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => setTests(prev => ({ ...prev, [key]: { ...prev[key], photo: reader.result as string } }))
    reader.readAsDataURL(file)
  }

  const analyze = () => {
    const scores: Record<string, number> = {}
    const inc = (name: string, val: number) => { scores[name] = (scores[name] || 0) + val }
    if (tests.gramStain.result === 'positive') inc('Staphylococcus aureus', 30)
    if (tests.catalase.result === 'positive') inc('Staphylococcus aureus', 25)
    if (tests.coagulase.result === 'positive') inc('Staphylococcus aureus', 35)
    if (tests.gramStain.result === 'negative') inc('E. coli', 20)
    if (tests.oxidase.result === 'negative') inc('E. coli', 20)
    if (tests.indole.result === 'positive') inc('E. coli', 30)
    if (tests.lactoseFermentation.result === 'positive') inc('E. coli', 30)
    if (tests.gramStain.result === 'negative') inc('Salmonella', 20)
    if (tests.catalase.result === 'positive') inc('Salmonella', 20)
    if (tests.citrate.result === 'positive') inc('Salmonella', 35)
    if (tests.lactoseFermentation.result === 'negative') inc('Salmonella', 25)
    if (tests.gramStain.result === 'positive') inc('Listeria monocytogenes', 25)
    if (tests.catalase.result === 'positive') inc('Listeria monocytogenes', 25)
    if (tests.coagulase.result === 'negative') inc('Listeria monocytogenes', 40)
    if (tests.gramStain.result === 'negative') inc('Pseudomonas aeruginosa', 25)
    if (tests.oxidase.result === 'positive') inc('Pseudomonas aeruginosa', 50)
    if (tests.gramStain.result === 'positive') inc('Lactobacillus', 20)
    if (tests.catalase.result === 'negative') inc('Lactobacillus', 25)
    if (tests.lactoseFermentation.result === 'positive') inc('Lactobacillus', 35)
    const max = Math.max(...Object.values(scores), 0)
    const match = Object.entries(scores).find(([,v]) => v === max)?.[0]
    if (match && BACTERIA[match]) setResult({ ...BACTERIA[match], confidence: Math.min(Math.round((max/100)*100), 95) })
  }

  const getColor = (key: string) => tests[key].result === 'unknown' ? '#F0F0F0' : (tests[key].result === 'positive' ? tests[key].positiveColor : tests[key].negativeColor)
  const getLabel = (key: string) => tests[key].result === 'unknown' ? 'Not Tested' : (tests[key].result === 'positive' ? tests[key].positiveDescription : tests[key].negativeDescription)

  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>{t('biochemicalTests.testResults')}</div>
            <div style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #c7d2fe', color: '#1f5fff', background: '#eff6ff', fontWeight: 700 }}>{t('biochemicalTests.selectResults')}</div>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {Object.entries(TESTS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: 700 }}>{t(`biochemicalTests.tests.${key}`)}</label>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{cfg.shortName}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setResultFor(key, 'positive')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '2px solid #22c55e', background: tests[key].result==='positive'? cfg.positiveColor: cfg.positiveColor+'33', color: tests[key].result==='positive'?'#fff':'#111', fontWeight: 700 }}>✓ {t('biochemicalTests.positive')}</button>
                  <button onClick={() => setResultFor(key, 'negative')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '2px solid #ef4444', background: tests[key].result==='negative'? cfg.negativeColor: cfg.negativeColor+'33', color: tests[key].result==='negative'?'#fff':'#111', fontWeight: 700 }}>✗ {t('biochemicalTests.negative')}</button>
                  <button onClick={() => setResultFor(key, 'unknown')} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #9ca3af', background: '#e5e7eb', fontWeight: 700 }}>⊘</button>
                </div>
                <div style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: '#f3f4f6' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, margin: '0 auto 6px', border: '2px solid #9ca3af', background: getColor(key) }} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{tests[key].result==='unknown' ? t('biochemicalTests.notTested') : getLabel(key)}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12 }}>{t('biochemicalTests.optionalPhoto')}</label>
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(key, f) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={analyze} style={{ padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(90deg,#ec4899,#6366f1)', color: '#fff', fontWeight: 800 }}>{t('biochemicalTests.results')}</button>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          {result ? (
            <div style={{ border: '1px solid #fbcfe8', borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontWeight: 800, color: '#db2777' }}>{result.name}</h3>
              <div style={{ margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{t('biochemicalTests.confidence')}</span>
                  <span style={{ fontWeight: 800 }}>{result.confidence}%</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999 }}>
                  <div style={{ width: `${result.confidence}%`, height: 8, background: 'linear-gradient(90deg,#ec4899,#6366f1)', borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.characteristics')}</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {result.characteristics.map((c,i) => (<li key={i} style={{ fontSize: 14 }}>{c}</li>))}
              </ul>
              <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.explanation')}</div>
                <div style={{ fontSize: 14 }}>{result.explanation}</div>
              </div>
              <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.commonIn')}</div>
                <div style={{ fontSize: 14 }}>{result.commonIn}</div>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid #c4b5fd', borderRadius: 12, padding: 16, textAlign: 'center' }}>{t('biochemicalTests.selectResults')}</div>
          )}
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{t('biochemicalTests.testSummary')}</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {Object.entries(TESTS_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{cfg.shortName}</span>
                <div style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid #9ca3af', background: getColor(key) }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}