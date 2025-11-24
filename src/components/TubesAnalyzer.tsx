import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon, byPrefixAndName } from '../ui/FA'
import { useTranslation } from 'react-i18next'
import BiochemicalTestsDisplay from './BiochemicalTestsDisplay'

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
  urease: { name: 'Urease', shortName: 'URS', positiveColor: '#f2f568ff', negativeColor: '#FF9F1C', positiveDescription: 'Yellow (Positive)', negativeDescription: 'Pink/Orange (Negative)' },
  lactoseFermentation: { name: 'Lactose Fermentation', shortName: 'LAC', positiveColor: '#f2f568ff', negativeColor: '#FFB6C1', positiveDescription: 'Yellow (Positive)', negativeDescription: 'Red/Pink (Negative)' },
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
  const [isSmall, setIsSmall] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1130px)')
    const apply = () => setIsSmall(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const setResultFor = (key: string, r: TestResult) => setTests(prev => ({ ...prev, [key]: { ...prev[key], result: r } }))
  const uploadPhoto = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setTests(prev => ({ ...prev, [key]: { ...prev[key], photo: dataUrl } }))
      processDataUrlFor(key, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const processDataUrlFor = useCallback((key: string, dataUrl: string) => {
    setTests(prev => ({ ...prev, [key]: { ...prev[key], photo: dataUrl } }))
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const cx = Math.floor(img.width / 2)
      const cy = Math.floor(img.height / 2)
      const size = Math.floor(Math.min(img.width, img.height) * 0.15)
      const x0 = Math.max(0, cx - size)
      const y0 = Math.max(0, cy - size)
      const w = Math.min(img.width - x0, size * 2)
      const h = Math.min(img.height - y0, size * 2)
      const imageData = ctx.getImageData(x0, y0, w, h).data
      let r = 0, g = 0, b = 0, count = 0
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i]
        g += imageData[i + 1]
        b += imageData[i + 2]
        count++
      }
      r = r / count; g = g / count; b = b / count
      const parseHex = (hex: string) => {
        const h = hex.replace('#','')
        const n = h.length === 3 ? h.split('').map(s => s + s).join('') : h
        return { r: parseInt(n.slice(0,2),16), g: parseInt(n.slice(2,4),16), b: parseInt(n.slice(4,6),16) }
      }
      const pos = parseHex(tests[key].positiveColor)
      const neg = parseHex(tests[key].negativeColor)
      const dist = (a:{r:number,g:number,b:number}, b2:{r:number,g:number,b:number}) => Math.sqrt((a.r-b2.r)**2+(a.g-b2.g)**2+(a.b-b2.b)**2)
      const dPos = dist({ r, g, b }, pos)
      const dNeg = dist({ r, g, b }, neg)
      const detected: TestResult = dPos <= dNeg ? 'positive' : 'negative'
      setResultFor(key, detected)
    }
    img.src = dataUrl
  }, [tests])

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

  const ResultsBlock = (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        {result ? (
          <div style={{ border: '1px solid #fbcfe8', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontWeight: 800, color: '#db2777' }}>{t(`biochemicalTests.bacteria.${(result.name || '').replace(/\s+/g,'_')}`, { defaultValue: result.name })}</h3>
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
              {result.characteristics.map((c,i) => (<li key={i} style={{ fontSize: 14 }}>{t(`biochemicalTests.characteristicsMap.${c.replace(/\W+/g,'_')}`, { defaultValue: c })}</li>))}
            </ul>
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.explanation')}</div>
              <div style={{ fontSize: 14 }}>{t(`biochemicalTests.explanations.${result.name.replace(/\s+/g,'_')}`, { defaultValue: result.explanation })}</div>
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.commonIn')}</div>
              <div style={{ fontSize: 14 }}>{t(`biochemicalTests.commonInMap.${result.name.replace(/\s+/g,'_')}`, { defaultValue: result.commonIn })}</div>
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
  )

  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: isSmall ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        
        <BiochemicalTestsDisplay
          testsConfig={TESTS_CONFIG}
          tests={tests}
          onTestChange={setResultFor}
          onPhotoUpload={uploadPhoto}
          onPhotoCapture={processDataUrlFor}
          showPhotos={true}
        />
        <button onClick={analyze} style={{ padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(90deg,#ec4899,#6366f1)', color: '#fff', fontWeight: 800 }}>{t('biochemicalTests.results')}</button>
        {isSmall && ResultsBlock}
      </div>
      {!isSmall && <div style={{ display: 'grid', gap: 16 }}>{ResultsBlock}</div>}
    </div>
  )
}