import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon, byPrefixAndName } from '../ui/FA'

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

type BiochemicalTestConfig = Record<string, Omit<BiochemicalTest, 'result' | 'photo'>>

interface BiochemicalTestsDisplayProps {
  testsConfig: BiochemicalTestConfig
  tests: Record<string, BiochemicalTest>
  onTestChange: (key: string, result: TestResult) => void
  onPhotoUpload: (key: string, file: File) => void
  onPhotoCapture: (key: string, dataUrl: string) => void
  showPhotos?: boolean
  compact?: boolean
}

export default function BiochemicalTestsDisplay({
  testsConfig,
  tests,
  onTestChange,
  onPhotoUpload,
  onPhotoCapture,
  showPhotos = true,
  compact = false,
}: BiochemicalTestsDisplayProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraFor, setCameraFor] = useState<string | null>(null)
  const [lastKey, setLastKey] = useState<string | null>(null)

  // Helper function to convert hex color to RGB
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '')
    const n = h.length === 3 ? h.split('').map(s => s + s).join('') : h
    return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) }
  }

  // Helper function to calculate color distance
  const colorDistance = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }) => {
    return Math.sqrt((color1.r - color2.r) ** 2 + (color1.g - color2.g) ** 2 + (color1.b - color2.b) ** 2)
  }

  // Analyze image and detect colors for all tests
  const analyzeImageColors = (dataUrl: string, specificKey?: string) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Process either a specific test or all tests
      const keysToProcess = specificKey ? [specificKey] : Object.keys(testsConfig)

      keysToProcess.forEach((key) => {
        const cx = Math.floor(img.width / 2)
        const cy = Math.floor(img.height / 2)
        const size = Math.floor(Math.min(img.width, img.height) * 0.15)
        const x0 = Math.max(0, cx - size)
        const y0 = Math.max(0, cy - size)
        const w = Math.min(img.width - x0, size * 2)
        const h = Math.min(img.height - y0, size * 2)
        const imageData = ctx.getImageData(x0, y0, w, h).data

        // Calculate average color of the center region
        let r = 0,
          g = 0,
          b = 0,
          count = 0
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i]
          g += imageData[i + 1]
          b += imageData[i + 2]
          count++
        }
        r = r / count
        g = g / count
        b = b / count

        // Get positive and negative reference colors
        const detectedColor = { r, g, b }
        const positiveRef = parseHex(tests[key].positiveColor)
        const negativeRef = parseHex(tests[key].negativeColor)

        // Compare distances
        const distToPositive = colorDistance(detectedColor, positiveRef)
        const distToNegative = colorDistance(detectedColor, negativeRef)

        // Determine result based on which color is closer
        const result = distToPositive <= distToNegative ? 'positive' : 'negative'
        onTestChange(key, result)
      })
    }
    img.src = dataUrl
  }

  const getColor = (key: string) => 
    tests[key].result === 'unknown' 
      ? '#F0F0F0' 
      : (tests[key].result === 'positive' 
        ? tests[key].positiveColor 
        : tests[key].negativeColor)

  const getLabel = (key: string) =>
    tests[key].result === 'unknown'
      ? t('biochemicalTests.notTested')
      : (tests[key].result === 'positive'
        ? t(`biochemicalTests.labels.${key}.positive`, { defaultValue: tests[key].positiveDescription })
        : t(`biochemicalTests.labels.${key}.negative`, { defaultValue: tests[key].negativeDescription }))

  const startCameraFor = async (key: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraFor(key)
    } catch {}
  }

  const captureCamera = () => {
    if (!videoRef.current || !cameraFor) return
    const v = videoRef.current
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')!
    ctx.drawImage(v, 0, 0)
    const data = c.toDataURL('image/jpeg')
    onPhotoCapture(cameraFor, data)
    // Automatically detect color for this test
    analyzeImageColors(data, cameraFor)
    const stream = v.srcObject as MediaStream | null
    stream?.getTracks().forEach(t => t.stop())
    setCameraFor(null)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 800 }}>{t('biochemicalTests.testResults')}</div>
          <div style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #c7d2fe', color: '#1f5fff', background: '#eff6ff', fontWeight: 700 }}>
            {t('biochemicalTests.selectResults')}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="bulkImageUpload" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>
            📸 Auto-detect all tests from image
          </label>
          <input
            id="bulkImageUpload"
            type="file"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) {
                const reader = new FileReader()
                reader.onload = () => {
                  const dataUrl = reader.result as string
                  // Analyze all tests from the image
                  analyzeImageColors(dataUrl)
                }
                reader.readAsDataURL(f)
              }
            }}
            style={{ fontSize: 12, width: '100%' }}
          />
        </div>
        <div className="bio-grid-2" style={{ gap: 12 }}>
          {Object.entries(testsConfig).map(([key, cfg]) => (
            <div key={key} style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: 700 }}>{t(`biochemicalTests.tests.${key}`)}</label>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{cfg.shortName}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }} onMouseEnter={() => setLastKey(key)}>
                <button
                  onClick={() => onTestChange(key, 'positive')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '2px solid #22c55e',
                    background: tests[key].result === 'positive' ? cfg.positiveColor : cfg.positiveColor + '33',
                    color: tests[key].result === 'positive' ? '#fff' : '#111',
                    fontWeight: 700,
                  }}
                >
                  ✓ {t('biochemicalTests.positive')}
                </button>
                <button
                  onClick={() => onTestChange(key, 'negative')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '2px solid #ef4444',
                    background: tests[key].result === 'negative' ? cfg.negativeColor : cfg.negativeColor + '33',
                    color: tests[key].result === 'negative' ? '#fff' : '#111',
                    fontWeight: 700,
                  }}
                >
                  ✗ {t('biochemicalTests.negative')}
                </button>
                <button
                  onClick={() => onTestChange(key, 'unknown')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '2px solid #9ca3af',
                    background: '#e5e7eb',
                    fontWeight: 700,
                  }}
                >
                  ⊘
                </button>
              </div>
              <div style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: '#b8b8b8ff' }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, margin: '0 auto 6px', border: '2px solid #9ca3af', background: getColor(key) }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>{getLabel(key)}</div>
              </div>
              {showPhotos && (
                <div>
                  <label style={{ fontSize: 12 }}>{t('biochemicalTests.optionalPhoto')}</label>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) {
                          // Read and auto-detect colors
                          const reader = new FileReader()
                          reader.onload = () => {
                            const dataUrl = reader.result as string
                            onPhotoUpload(key, f)
                            analyzeImageColors(dataUrl, key)
                            setLastKey(key)
                          }
                          reader.readAsDataURL(f)
                        }
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => startCameraFor(key)}
                        aria-label={t('biochemicalTests.useCamera')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          border: '1px solid #ccc',
                          background: '#fff',
                        }}
                      >
                        <FontAwesomeIcon icon={byPrefixAndName.fass['aperture']} width={22} height={22} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {cameraFor && (
        <div style={{ display: 'grid', gap: 8 }}>
          <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} />
          <div>
            <button
              onClick={captureCamera}
              style={{ padding: '10px 14px', borderRadius: 10, background: '#22c55e', color: '#fff', fontWeight: 700 }}
            >
              {t('biochemicalTests.optionalPhoto')}
            </button>
            <button
              onClick={() => {
                const s = videoRef.current?.srcObject as MediaStream | undefined
                s?.getTracks().forEach(t => t.stop())
                setCameraFor(null)
              }}
              style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 10, background: '#ef4444', color: '#fff', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
