export type CircleRegion = { centerX: number; centerY: number; radius: number }

export type Colony = {
  id: number
  sizePx: number
  centroidX: number
  centroidY: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  circularity: number
  density: number
  colorR: number
  colorG: number
  colorB: number
  sizeCategory: 'Below Average' | 'Average' | 'Large (2x+)' | 'Large (4x+)'
  shapeType: string
  countMultiplier: number
  isNestedInParent?: boolean
  parentId?: number
}

const MIN_COLONY_SIZE = 10

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = err => reject(err)
    img.src = src
  })
}

function getImageData(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { data, ctx, canvas }
}

function detectBackgroundColor(
  rgb: Uint8ClampedArray,
  width: number,
  height: number,
  circle?: CircleRegion
): 'dark' | 'light' {
  const vals: number[] = []
  if (circle) {
    const r2 = circle.radius * circle.radius
    const step = Math.max(1, Math.floor(circle.radius / 20))
    for (let y = Math.max(0, Math.floor(circle.centerY - circle.radius)); y <= Math.min(height - 1, Math.floor(circle.centerY + circle.radius)); y += step) {
      for (let x = Math.max(0, Math.floor(circle.centerX - circle.radius)); x <= Math.min(width - 1, Math.floor(circle.centerX + circle.radius)); x += step) {
        const dx = x - circle.centerX
        const dy = y - circle.centerY
        if (dx * dx + dy * dy <= r2) {
          const i = (y * width + x) * 4
          const b = (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3
          vals.push(b)
        }
      }
    }
  } else {
    const step = Math.max(1, Math.floor(width / 50))
    for (let i = 0; i < rgb.length; i += step * 4) {
      const b = (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3
      vals.push(b)
    }
  }
  if (vals.length === 0) return 'light'
  vals.sort((a, b) => a - b)
  const median = vals[Math.floor(vals.length / 2)]
  return median < 127 ? 'dark' : 'light'
}

function calculateOtsuThreshold(gray: Uint8ClampedArray): number {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++
  const total = gray.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0
  let wB = 0
  let maxVar = 0
  let thr = 0
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const v = wB * wF * Math.pow(mB - mF, 2)
    if (v > maxVar) {
      maxVar = v
      thr = t
    }
  }
  return thr
}

function isThinFilament(width: number, height: number, density: number, circularity: number): boolean {
  const ar = Math.max(width, height) / (Math.min(width, height) + 1)
  if (ar > 5 && (density < 0.3 || circularity < 0.2)) return true
  if (Math.min(width, height) < 3 && ar > 3) return true
  return false
}

function classifyShape(circularity: number, density: number): string {
  if (circularity > 0.8) return 'Round'
  if (circularity > 0.6) return 'Oval'
  if (density > 0.8) return 'Irregular-Compact'
  return 'Irregular-Sparse'
}

export async function analyzeImage(
  dataUrl: string,
  circle: CircleRegion | null,
  bgColorMode: 'auto' | 'light' | 'dark' | 'unsure',
  colorToCount: 'auto' | 'dark' | 'light',
  invertDetection: boolean
) {
  const img = await loadImage(dataUrl)
  const { data: imgData, canvas, ctx } = getImageData(img)
  const width = imgData.width
  const height = imgData.height
  const rgb = imgData.data
  const gray = new Uint8ClampedArray(width * height)
  for (let i = 0; i < rgb.length; i += 4) {
    const g = Math.round(0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2])
    gray[i / 4] = g
  }
  let bg: 'dark' | 'light' = 'light'
  if (bgColorMode === 'auto' || bgColorMode === 'unsure') bg = detectBackgroundColor(rgb, width, height, circle || undefined)
  else bg = bgColorMode
  let countDark = false
  if (colorToCount === 'auto') countDark = bg === 'light'
  else countDark = colorToCount === 'dark'
  if (invertDetection) countDark = !countDark
  const otsu = calculateOtsuThreshold(gray)
  let threshold = otsu
  if (countDark) threshold = Math.max(otsu - 20, 0)
  else threshold = Math.min(otsu + 20, 255)
  const pxCount = width * height
  const binary = new Uint8Array(pxCount)
  const colorMap: Map<number, { r: number; g: number; b: number }> = new Map()
  for (let i = 0; i < pxCount; i++) {
    const px = i % width
    const py = Math.floor(i / width)
    let on = countDark ? gray[i] < threshold : gray[i] > threshold
    if (circle) {
      const d = Math.hypot(px - circle.centerX, py - circle.centerY)
      if (d > circle.radius) on = false
    }
    binary[i] = on ? 1 : 0
    if (on) {
      const idx = i * 4
      colorMap.set(i, { r: rgb[idx], g: rgb[idx + 1], b: rgb[idx + 2] })
    }
  }
  const visited = new Uint8Array(pxCount)
  const colonies: Colony[] = []
  const stack: number[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (binary[idx] === 1 && !visited[idx]) {
        const pixels: number[] = []
        stack.push(idx)
        visited[idx] = 1
        while (stack.length) {
          const cur = stack.pop() as number
          pixels.push(cur)
          const cx = cur % width
          const cy = Math.floor(cur / width)
          const nbs = [
            [cx - 1, cy],
            [cx + 1, cy],
            [cx, cy - 1],
            [cx, cy + 1],
          ]
          for (const [nx, ny] of nbs) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx
              if (binary[nidx] === 1 && !visited[nidx]) {
                visited[nidx] = 1
                stack.push(nidx)
              }
            }
          }
        }
        const size = pixels.length
        if (size < MIN_COLONY_SIZE) continue
        let sumX = 0,
          sumY = 0,
          sumR = 0,
          sumG = 0,
          sumB = 0
        let minX = width,
          maxX = 0,
          minY = height,
          maxY = 0
        for (const p of pixels) {
          const px = p % width
          const py = Math.floor(p / width)
          sumX += px
          sumY += py
          minX = Math.min(minX, px)
          maxX = Math.max(maxX, px)
          minY = Math.min(minY, py)
          maxY = Math.max(maxY, py)
          const c = colorMap.get(p)
          if (c) {
            sumR += c.r
            sumG += c.g
            sumB += c.b
          }
        }
        const centroidX = sumX / size
        const centroidY = sumY / size
        const colWidth = maxX - minX + 1
        const colHeight = maxY - minY + 1
        const bounding = colWidth * colHeight
        const density = size / bounding
        let perimeter = 0
        const set = new Set(pixels)
        for (const p of pixels) {
          const px = p % width
          const py = Math.floor(p / width)
          const nbs = [
            [px - 1, py],
            [px + 1, py],
            [px, py - 1],
            [px, py + 1],
          ]
          for (const [nx, ny] of nbs) {
            const nidx = ny * width + nx
            if (!set.has(nidx)) perimeter++
          }
        }
        const circularity = (4 * Math.PI * size) / (perimeter * perimeter)
        const colorR = Math.round(sumR / size)
        const colorG = Math.round(sumG / size)
        const colorB = Math.round(sumB / size)
        if (isThinFilament(colWidth, colHeight, density, circularity)) continue
        colonies.push({
          id: colonies.length + 1,
          sizePx: size,
          centroidX,
          centroidY,
          minX,
          maxX,
          minY,
          maxY,
          width: colWidth,
          height: colHeight,
          circularity: Math.min(1, circularity),
          density,
          colorR,
          colorG,
          colorB,
          sizeCategory: 'Average',
          shapeType: 'Unknown',
          countMultiplier: 1,
        })
      }
    }
  }
  if (colonies.length > 0) {
    const sorted = [...colonies].sort((a, b) => a.sizePx - b.sizePx)
    const median = sorted[Math.floor(colonies.length / 2)].sizePx
    for (let i = 0; i < colonies.length; i++) {
      const A = colonies[i]
      for (let j = 0; j < colonies.length; j++) {
        if (i !== j) {
          const B = colonies[j]
          const contained = B.minX >= A.minX && B.maxX <= A.maxX && B.minY >= A.minY && B.maxY <= A.maxY
          const muchSmaller = B.sizePx < A.sizePx * 0.5
          if (contained && muchSmaller && !B.isNestedInParent) {
            B.isNestedInParent = true
            B.parentId = A.id
          }
        }
      }
    }
    for (const col of colonies) {
      if (col.sizePx >= median * 4 && col.isNestedInParent === undefined) {
        col.countMultiplier = 4
        col.sizeCategory = 'Large (4x+)'
      } else if (col.sizePx >= median * 2 && col.isNestedInParent === undefined) {
        col.countMultiplier = 2
        col.sizeCategory = 'Large (2x+)'
      } else {
        col.countMultiplier = 1
        col.sizeCategory = col.sizePx < median ? 'Below Average' : 'Average'
      }
      col.shapeType = classifyShape(col.circularity, col.density)
    }
  }
  const bw = ctx.createImageData(width, height)
  for (let i = 0; i < pxCount; i++) {
    const v = binary[i] ? 255 : 0
    const idx = i * 4
    bw.data[idx] = v
    bw.data[idx + 1] = v
    bw.data[idx + 2] = v
    bw.data[idx + 3] = 255
  }
  ctx.putImageData(bw, 0, 0)
  const dataOut = canvas.toDataURL('image/png')
  const avgSize = colonies.length > 0 ? Math.round(colonies.reduce((s, c) => s + c.sizePx, 0) / colonies.length) : 0
  let effectiveCount = 0
  for (const col of colonies) {
    const hasNested = colonies.some(c => c.parentId === col.id)
    if (!hasNested) effectiveCount += col.countMultiplier
  }
  return { bwImage: dataOut, colonies, avgSize, effectiveCount }
}