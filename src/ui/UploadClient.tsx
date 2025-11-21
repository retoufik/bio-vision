import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { analyzeImage, CircleRegion, Colony } from '../analysis/colony'
import { FontAwesomeIcon, byPrefixAndName } from './FA'

type ObservationData = {
  elevation: 'flat' | 'raised' | 'convex' | 'umbonate'
  texture: 'smooth' | 'rough' | 'mucoid' | 'powdery'
  hemolysis: 'none' | 'alpha' | 'beta' | 'gamma'
  pigmentation: 'none' | 'white' | 'yellow' | 'orange' | 'red' | 'brown' | 'black' | 'green' | 'pigmented'
  otherNotes: string
  sampleType?: 'milk' | 'cheese' | 'meat' | 'fermented' | 'water' | 'soil' | 'grain' | 'processed_food' | 'other' | ''
  cultureMedium?: 'pca' | 'mrsa' | 'vogel' | 'trypticase_soy' | 'blood_agar' | 'macconkey' | 'selective' | 'enrichment' | 'other' | ''
}

type BiochemicalTests = {
  gramStain: 'positive' | 'negative' | 'variable' | 'unknown'
  catalase: 'positive' | 'negative' | 'unknown'
  coagulase: 'positive' | 'negative' | 'unknown'
  oxidase: 'positive' | 'negative' | 'unknown'
  motility: 'positive' | 'negative' | 'unknown'
  sporeForming: 'positive' | 'negative' | 'unknown'
  fermentation: 'glucose' | 'lactose' | 'sucrose' | 'none' | 'unknown'
  vogesProskauer: 'positive' | 'negative' | 'unknown'
  methylRed: 'positive' | 'negative' | 'unknown'
}

type Candidate = { name: string; confidence: number; reason: string[] }

function identifyBacteria(colonies: Colony[], observations: ObservationData, biochemical: BiochemicalTests): Candidate[] {
  const map: Record<string, { confidence: number; reason: string[] }> = {}
  const add = (name: string, score: number, why: string) => {
    if (!map[name]) map[name] = { confidence: 0, reason: [] }
    map[name].confidence += score
    map[name].reason.push(why)
  }
  if (biochemical.gramStain === 'positive') {
    if (biochemical.catalase === 'negative') {
      add('Streptococcus', 15, 'Gram+ Catalase-')
      if (observations.hemolysis === 'beta') add('Streptococcus pyogenes', 20, 'Beta hemolysis')
      else if (observations.hemolysis === 'alpha') add('Streptococcus pneumoniae', 18, 'Alpha hemolysis')
    }
    if (biochemical.catalase === 'positive') {
      add('Staphylococcus', 20, 'Gram+ Catalase+')
      if (biochemical.coagulase === 'positive') {
        add('Staphylococcus aureus', 25, 'Coagulase+')
        if (observations.pigmentation === 'yellow' || observations.pigmentation === 'orange') add('Staphylococcus aureus', 10, 'Yellow/orange pigmentation')
      } else if (biochemical.coagulase === 'negative') {
        add('Staphylococcus epidermidis', 20, 'Coagulase-')
      }
    }
  }
  if (biochemical.gramStain === 'negative') {
    if (biochemical.oxidase === 'positive') {
      add('Pseudomonas', 18, 'Gram- Oxidase+')
      if (observations.pigmentation === 'green') add('Pseudomonas aeruginosa', 25, 'Green pigmentation')
    } else if (biochemical.oxidase === 'negative') {
      add('Enterobacteriaceae', 15, 'Gram- Oxidase-')
      if (biochemical.methylRed === 'positive') {
        add('E. coli', 15, 'Methyl Red+')
        if (biochemical.vogesProskauer === 'negative') add('E. coli', 10, 'MR+/VP-')
      }
      if (biochemical.vogesProskauer === 'positive') add('Klebsiella', 15, 'VP+')
    }
  }
  if (biochemical.sporeForming === 'positive' && biochemical.gramStain === 'positive') add('Bacillus', 25, 'Spore-forming Gram+')
  if (biochemical.motility === 'positive') add('E. coli', 10, 'Motile')
  else if (biochemical.motility === 'negative') add('Klebsiella', 10, 'Non-motile')
  if (colonies.length > 0) {
    const avg = colonies.reduce((s, c) => s + c.sizePx, 0) / colonies.length
    const small = colonies.filter(c => c.sizePx < avg / 2).length > colonies.length / 2
    const large = colonies.some(c => c.sizePx > avg * 2)
    if (small) add('Streptococcus', 8, 'Small colonies')
    if (large) add('Bacillus', 8, 'Large colonies')
    const lighty = colonies.some(c => {
      const max = Math.max(c.colorR, c.colorG, c.colorB)
      const min = Math.min(c.colorR, c.colorG, c.colorB)
      return max > 200 && min > 180
    })
    if (lighty) add('Streptococcus pneumoniae', 8, 'Translucent colonies')
  }
  if (observations.texture === 'mucoid') {
    add('Klebsiella', 12, 'Mucoid texture')
    add('Pseudomonas aeruginosa', 8, 'Mucoid growth')
  }
  if (biochemical.fermentation === 'glucose') add('E. coli', 8, 'Glucose fermentation')
  const maxScore = Math.max(...Object.values(map).map(c => c.confidence), 1)
  const list = Object.entries(map)
    .map(([name, d]) => ({ name, confidence: Math.round((d.confidence / maxScore) * 100), reason: d.reason }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
  return list
}

function downloadCSV(colonies: Colony[], avgSize: number | null) {
  const headers = ['Colony ID','Color RGB','Size (px)','Size Category','Count Multiplier','Is Nested','Shape','Circularity','Density','Centroid X','Centroid Y','Width','Height']
  const rows = colonies.map(c => [
    c.id,
    `${c.colorR},${c.colorG},${c.colorB}`,
    c.sizePx,
    c.sizeCategory,
    c.countMultiplier || 1,
    c.isNestedInParent ? `Yes (Parent: ${c.parentId})` : 'No',
    c.shapeType,
    c.circularity.toFixed(3),
    (c.density * 100).toFixed(1),
    c.centroidX.toFixed(1),
    c.centroidY.toFixed(1),
    c.width,
    c.height,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'colonies.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function UploadClient() {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [colonies, setColonies] = useState<Colony[]>([])
  const [avgSize, setAvgSize] = useState<number | null>(null)
  const [effectiveCount, setEffectiveCount] = useState<number | null>(null)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)
  const [circle, setCircle] = useState<CircleRegion | null>(null)
  const [drag, setDrag] = useState<'center' | 'edge' | null>(null)
  const [bgColorMode, setBgColorMode] = useState<'auto' | 'light' | 'dark' | 'unsure'>('auto')
  const [colorToCount, setColorToCount] = useState<'auto' | 'dark' | 'light'>('auto')
  const [invertDetection, setInvertDetection] = useState(false)
  const [observations, setObservations] = useState<ObservationData>({ elevation: 'flat', texture: 'smooth', hemolysis: 'none', pigmentation: 'none', otherNotes: '', sampleType: '', cultureMedium: '' })
  const [biochemical, setBiochemical] = useState<BiochemicalTests>({ gramStain: 'unknown', catalase: 'unknown', coagulase: 'unknown', oxidase: 'unknown', motility: 'unknown', sporeForming: 'unknown', fermentation: 'unknown', vogesProskauer: 'unknown', methylRed: 'unknown' })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showCameraFor, setShowCameraFor] = useState<string | null>(null)
  const [bioPhotos, setBioPhotos] = useState<Record<string, string | null>>({})
  const [selectedColonyId, setSelectedColonyId] = useState<number | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result ?? '')
      setPreview(data)
      setResultImage(null)
      setColonies([])
      setAvgSize(null)
      setEffectiveCount(null)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const it of Array.from(items)) {
        if (it.type.startsWith('image/')) {
          const file = it.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = () => {
            const data = String(reader.result ?? '')
            setPreview(data)
            setResultImage(null)
            setColonies([])
            setAvgSize(null)
            setEffectiveCount(null)
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setShowCamera(true)
  } catch {}
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const v = videoRef.current
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')!
    ctx.drawImage(v, 0, 0)
    const data = c.toDataURL('image/jpeg')
    if (showCameraFor) {
      setBioPhotos(prev => ({ ...prev, [showCameraFor!]: data }))
      setShowCameraFor(null)
    } else {
      setPreview(data)
    }
    setShowCamera(false)
    const stream = v.srcObject as MediaStream | null
    stream?.getTracks().forEach(t => t.stop())
  }

  useEffect(() => {
    if (!preview || !imgRef.current) return
    imgRef.current.onload = () => {
      const w = imgRef.current!.width
      const h = imgRef.current!.height
      setImgDims({ w, h })
      const r = Math.min(w, h) * 0.35
      setCircle({ centerX: w / 2, centerY: h / 2, radius: r })
    }
  }, [preview])

  useEffect(() => {
    if (!canvasRef.current || !imgDims || !circle) return
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = imgDims.w
    c.height = imgDims.h
    ctx.drawImage(imgRef.current!, 0, 0)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, imgDims.w, imgDims.h)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(circle.centerX, circle.centerY, circle.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.arc(circle.centerX, circle.centerY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(circle.centerX + circle.radius, circle.centerY, 8, 0, Math.PI * 2)
    ctx.fill()
  }, [imgDims, circle])

  useEffect(() => {
    if (!resultCanvasRef.current || !resultImage || !imgDims || !selectedColonyId) return
    const img = new Image()
    img.onload = () => {
      const canvas = resultCanvasRef.current!
      canvas.width = imgDims.w
      canvas.height = imgDims.h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const col = colonies.find(c => c.id === selectedColonyId)
      if (!col) return
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(col.centroidX, col.centroidY, 15, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.strokeRect(col.minX, col.minY, col.width, col.height)
    }
    img.src = resultImage
  }, [resultImage, selectedColonyId, colonies, imgDims])

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!circle || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / rect.width
    const sy = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * sx
    const y = (e.clientY - rect.top) * sy
    const d = Math.hypot(x - circle.centerX, y - circle.centerY)
    if (d < 20) setDrag('center')
    else if (Math.abs(d - circle.radius) < 20) setDrag('edge')
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drag || !circle || !canvasRef.current || !imgDims) return
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / rect.width
    const sy = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * sx
    const y = (e.clientY - rect.top) * sy
    if (drag === 'center') setCircle({ ...circle, centerX: Math.max(circle.radius, Math.min(imgDims.w - circle.radius, x)), centerY: Math.max(circle.radius, Math.min(imgDims.h - circle.radius, y)) })
    else {
      const nr = Math.hypot(x - circle.centerX, y - circle.centerY)
      const maxR = Math.min(circle.centerX, circle.centerY, imgDims.w - circle.centerX, imgDims.h - circle.centerY)
      setCircle({ ...circle, radius: Math.max(20, Math.min(nr, maxR)) })
    }
  }
  function onMouseUp() {
    setDrag(null)
  }

  async function analyze() {
    if (!preview || !circle) return
    toast.info(t('disclaimer.analysis'))
    const out = await analyzeImage(preview, circle, bgColorMode, colorToCount, invertDetection)
    setResultImage(out.bwImage)
    setColonies(out.colonies)
    setAvgSize(out.avgSize)
    setEffectiveCount(out.effectiveCount)
    setSelectedColonyId(null)
  }

  useEffect(() => {
    if (resultImage) toast.info(t('disclaimer.results'))
  }, [resultImage, t])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{ fontWeight: 700 }}>{t('colonyAnalyzer.uploadImage')}</label>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>
              <label htmlFor="dropzone-file" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:256, background:'var(--app-bg)', color:'var(--app-fg)', border:'1px dashed var(--app-border)', borderRadius:12, cursor:'pointer' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:20, paddingBottom:24 }}>
                  <svg style={{ width:32, height:32, marginBottom:12 }} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
                  <p style={{ marginBottom:8, fontSize:14 }}><span style={{ fontWeight:700 }}>{t('colonyAnalyzer.clickToUpload', { defaultValue: 'Click to upload' })}</span> {t('orDragAndDrop', { defaultValue: 'or drag and drop' })}</p>
                  <p style={{ fontSize:12 }}>{t('colonyAnalyzer.allowedFormats', { defaultValue: 'SVG, PNG, JPG or GIF (MAX. 800x400px)' })}</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={onFile} />
              </label>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
              <button onClick={startCamera} aria-label={t('biochemicalTests.useCamera')} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:64, height:64, borderRadius:32, border: '1px solid #ccc', background: '#fff' }}>
                <FontAwesomeIcon icon={byPrefixAndName.fass['aperture']} width={28} height={28} />
              </button>
            </div>
          </div>
          {showCamera && (
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} />
              <div>
                <button onClick={capturePhoto} style={{ padding: '10px 14px', borderRadius: 10, background: '#22c55e', color: '#fff', fontWeight: 700 }}>{t('biochemicalTests.optionalPhoto')}</button>
                <button onClick={() => { const s = videoRef.current?.srcObject as MediaStream | undefined; s?.getTracks().forEach(t => t.stop()); setShowCamera(false) }} style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 10, background: '#ef4444', color: '#fff', fontWeight: 700 }}>Close</button>
              </div>
            </div>
          )}
        </div>
        {preview && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700 }}>{t('colonyAnalyzer.detectionSettings')}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['auto', 'light', 'dark', 'unsure'].map(v => (
                  <button key={v} onClick={() => setBgColorMode(v as any)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: bgColorMode === v ? '#1f5fff' : '#fff', color: bgColorMode === v ? '#fff' : '#333', fontWeight: 600 }}>{v}</button>
                ))}
                {['auto', 'dark', 'light'].map(v => (
                  <button key={v} onClick={() => setColorToCount(v as any)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: colorToCount === v ? '#8a2be2' : '#fff', color: colorToCount === v ? '#fff' : '#333', fontWeight: 600 }}>{v}</button>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={invertDetection} onChange={e => setInvertDetection(e.target.checked)} />
                  {t('colonyAnalyzer.invert')}
                </label>
              </div>
            </div>
            <div onDragOver={e => { e.preventDefault() }} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = () => { const data = String(reader.result ?? ''); setPreview(data); setResultImage(null); setColonies([]); setAvgSize(null); setEffectiveCount(null) }; reader.readAsDataURL(f) } }}>
              <img ref={imgRef} src={preview} alt="reference" style={{ display: 'none' }} />
              <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={e => {
                  if (!circle || !canvasRef.current) return
                  const rect = canvasRef.current.getBoundingClientRect()
                  const sx = canvasRef.current.width / rect.width
                  const sy = canvasRef.current.height / rect.height
                  const t = e.touches[0]
                  const x = (t.clientX - rect.left) * sx
                  const y = (t.clientY - rect.top) * sy
                  const d = Math.hypot(x - circle.centerX, y - circle.centerY)
                  if (d < 20) setDrag('center')
                  else if (Math.abs(d - circle.radius) < 20) setDrag('edge')
                }}
                onTouchMove={e => {
                  if (!drag || !circle || !canvasRef.current || !imgDims) return
                  const rect = canvasRef.current.getBoundingClientRect()
                  const sx = canvasRef.current.width / rect.width
                  const sy = canvasRef.current.height / rect.height
                  const t = e.touches[0]
                  const x = (t.clientX - rect.left) * sx
                  const y = (t.clientY - rect.top) * sy
                  if (drag === 'center') setCircle({ ...circle, centerX: Math.max(circle.radius, Math.min(imgDims.w - circle.radius, x)), centerY: Math.max(circle.radius, Math.min(imgDims.h - circle.radius, y)) })
                  else {
                    const nr = Math.hypot(x - circle.centerX, y - circle.centerY)
                    const maxR = Math.min(circle.centerX, circle.centerY, imgDims.w - circle.centerX, imgDims.h - circle.centerY)
                    setCircle({ ...circle, radius: Math.max(20, Math.min(nr, maxR)) })
                  }
                }}
                onTouchEnd={() => setDrag(null)}
                style={{ maxWidth: '100%', border: '2px solid #f97316', borderRadius: 12, cursor: drag ? 'grabbing' : 'grab' }}
              />
            </div>
            <div>
              <button onClick={analyze} disabled={!preview || !circle} style={{ padding: '12px 16px', borderRadius: 12, background: '#1f5fff', color: '#fff', fontWeight: 700 }}>{t('colonyAnalyzer.analyze')}</button>
            </div>
          </div>
        )}
        {resultImage && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700 }}>{t('colonyAnalyzer.results')}</h3>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('colonyAnalyzer.effectiveCount')}: {effectiveCount ?? colonies.length}</div>
              {selectedColonyId ? (
                <canvas ref={resultCanvasRef} style={{ maxWidth: '100%', borderRadius: 12, border: '2px solid #ef4444' }} />
              ) : (
                <img src={resultImage} alt="bw" style={{ maxWidth: '100%', borderRadius: 12 }} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700 }}>{t('colonyAnalyzer.coloniesDetected')} ({colonies.length})</h3>
                <button onClick={() => downloadCSV(colonies, avgSize)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #ccc', background: '#fff', fontWeight: 700 }}>{t('exportCsv')}</button>
              </div>
          <div style={{ display: 'grid', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
          {colonies.map(c => (
            <div key={c.id} onClick={() => setSelectedColonyId(selectedColonyId === c.id ? null : c.id)} style={{ border: '1px solid #ccc', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, cursor: 'pointer' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Colony #{c.id}</div>
                <div>Size: {c.sizePx} px</div>
                      <div>Category: {c.sizeCategory}</div>
                      <div>Shape: {c.shapeType}</div>
                      <div>Circularity: {c.circularity.toFixed(3)}</div>
                      <div>Density: {(c.density * 100).toFixed(1)}%</div>
                      <div>Position: ({c.centroidX.toFixed(1)}, {c.centroidY.toFixed(1)})</div>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 8, border: '2px solid #999', background: `rgb(${c.colorR},${c.colorG},${c.colorB})` }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontWeight: 700 }}>{t('observations')}</h3>
              <div className="obs-card bio-grid-2">
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.elevation')}</span>
                  <select className="obs-select" value={observations.elevation} onChange={e => setObservations({ ...observations, elevation: e.target.value as any })}>
                    {['flat','raised','convex','umbonate'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.elevation.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.texture')}</span>
                  <select className="obs-select" value={observations.texture} onChange={e => setObservations({ ...observations, texture: e.target.value as any })}>
                    {['smooth','rough','mucoid','powdery'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.texture.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.hemolysis')}</span>
                  <select className="obs-select" value={observations.hemolysis} onChange={e => setObservations({ ...observations, hemolysis: e.target.value as any })}>
                    {['none','alpha','beta','gamma'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.hemolysis.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.pigmentation')}</span>
                  <select className="obs-select" value={observations.pigmentation} onChange={e => setObservations({ ...observations, pigmentation: e.target.value as any })}>
                    {['none','white','yellow','orange','red','brown','black','green','pigmented'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.pigmentation.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.sampleType')}</span>
                  <select className="obs-select" value={observations.sampleType} onChange={e => setObservations({ ...observations, sampleType: e.target.value as any })}>
                    {['','milk','cheese','meat','fermented','water','soil','grain','processed_food','other'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.sampleType.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.cultureMedium')}</span>
                  <select className="obs-select" value={observations.cultureMedium} onChange={e => setObservations({ ...observations, cultureMedium: e.target.value as any })}>
                    {['','pca','mrsa','vogel','trypticase_soy','blood_agar','macconkey','selective','enrichment','other'].map(o => (<option key={o} value={o}>{t(`colonyAnalyzer.observationOptions.cultureMedium.${o}`)}</option>))}
                  </select>
                </label>
                <label style={{ gridColumn: '1/-1', display: 'grid', gap: 4 }}>
                  <span className="obs-label">{t('colonyAnalyzer.observations.otherNotes')}</span>
                  <textarea className="obs-text" value={observations.otherNotes} onChange={e => setObservations({ ...observations, otherNotes: e.target.value })} rows={3} />
                </label>
              </div>
            </div>
            <div>
              <h3 style={{ fontWeight: 700 }}>{t('biochemicalTests.title')}</h3>
              <div className="bio-grid-2">
                {Object.entries(biochemical).map(([key, val]) => (
                  <div key={key} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>{t(`biochemicalTests.tests.${key}`)}</span>
                      <span style={{ fontSize: 12 }}>
                        {val === 'positive' ? t('biochemicalTests.positive') : val === 'negative' ? t('biochemicalTests.negative') : val === 'unknown' ? t('biochemicalTests.notTested') : t(`biochemicalTests.values.${val}`, { defaultValue: String(val) })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setBiochemical({ ...biochemical, [key]: 'positive' as any })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '2px solid #22c55e', background: val==='positive'?'#22c55e':'#22c55e22', color: val==='positive'?'#fff':'#111', fontWeight: 700 }}>✓ {t('biochemicalTests.positive')}</button>
                      <button onClick={() => setBiochemical({ ...biochemical, [key]: 'negative' as any })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '2px solid #ef4444', background: val==='negative'?'#ef4444':'#ef444422', color: val==='negative'?'#fff':'#111', fontWeight: 700 }}>✗ {t('biochemicalTests.negative')}</button>
                      <button onClick={() => setBiochemical({ ...biochemical, [key]: 'unknown' as any })} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #9ca3af', background: '#e5e7eb', fontWeight: 700 }}>⊘ {t('biochemicalTests.notTested')}</button>
                      <button onClick={() => { setShowCameraFor(key); startCamera() }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontWeight: 700 }}>{t('biochemicalTests.useCamera')}</button>
                      {bioPhotos[key] && <img src={bioPhotos[key]!} alt="bio" style={{ width: 48, height: 48, borderRadius: 8, border: '1px solid #ccc' }} />}
                    </div>
                  </div>
                ))}
              </div>
              {showCameraFor && showCamera && (
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>{t('biochemicalTests.tests.' + showCameraFor)}</div>
                  <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} />
                  <div>
                    <button onClick={capturePhoto} style={{ padding: '10px 14px', borderRadius: 10, background: '#22c55e', color: '#fff', fontWeight: 700 }}>{t('biochemicalTests.optionalPhoto')}</button>
                    <button onClick={() => { const s = videoRef.current?.srcObject as MediaStream | undefined; s?.getTracks().forEach(t => t.stop()); setShowCamera(false); setShowCameraFor(null) }} style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 10, background: '#ef4444', color: '#fff', fontWeight: 700 }}>Close</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontWeight: 700 }}>{t('biochemicalTests.identification') || 'Identification'}</h3>
              {(() => {
                const hasBio = Object.values(biochemical).some(v => v !== 'unknown')
                if (!hasBio || colonies.length === 0) {
                  return <div style={{ border: '1px solid var(--app-border)', background: 'var(--app-bg)', color: 'var(--app-fg)', borderRadius: 12, padding: 12 }}>{t('colonyAnalyzer.identifyPrompt')}</div>
                }
                return (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {identifyBacteria(colonies, observations, biochemical).map((cand, idx) => (
                      <div key={idx} style={{ border: '1px solid #b197fc', borderRadius: 12, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>{cand.name}</span>
                          <span>{cand.confidence}%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#555' }}>{cand.reason.join(' • ')}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('biochemicalTests.testSummary')}</div>
                <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                  {Object.entries(biochemical).filter(([k,v]) => v !== 'unknown').map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t(`biochemicalTests.tests.${k}`)}</span>
                      <span style={{ fontWeight: 700 }}>
                        {v === 'positive' ? t('biochemicalTests.positive') : v === 'negative' ? t('biochemicalTests.negative') : v === 'unknown' ? t('biochemicalTests.notTested') : t(`biochemicalTests.values.${v}`, { defaultValue: String(v) })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}