/**
 * Automated biochemical test detection using image analysis
 */

/**
 * Detects Coagulase test result from tube image
 * Positive result shows clots/particles in the tube
 * Negative result shows clear liquid
 */
export function detectCoagulase(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise<'positive' | 'negative'>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Analyze center region of the tube
      const cx = Math.floor(img.width / 2)
      const cy = Math.floor(img.height / 2)
      const size = Math.floor(Math.min(img.width, img.height) * 0.2)
      const x0 = Math.max(0, cx - size)
      const y0 = Math.max(0, cy - size)
      const w = Math.min(img.width - x0, size * 2)
      const h = Math.min(img.height - y0, size * 2)

      const imageData = ctx.getImageData(x0, y0, w, h).data
      let particleCount = 0
      let clearCount = 0

      // Sample every 3rd pixel to balance accuracy and performance
      for (let i = 0; i < imageData.length; i += 12) {
        const r = imageData[i]
        const g = imageData[i + 1]
        const b = imageData[i + 2]

        // Calculate luminance (perceived brightness)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b
        const colorVariation = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b)

        // Particles/clots: dark or variable color (turbid)
        if (luminance < 150 || colorVariation > 60) {
          particleCount++
        }
        // Clear liquid: bright and uniform color
        else if (luminance > 200 && colorVariation < 30) {
          clearCount++
        }
      }

      // Positive if clear > particles (tube is clear = coagulase not present = positive)
      resolve(clearCount > particleCount ? 'positive' : 'negative')
    }
    img.src = dataUrl
  })
}

/**
 * Detects Citrate test result from tube image
 * Positive result shows BLUE color (any shade) due to pH indicator
 * Negative result shows no color (clear/light/other colors)
 */
export function detectCitrate(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise<'positive' | 'negative'>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Analyze center region of the tube
      const cx = Math.floor(img.width / 2)
      const cy = Math.floor(img.height / 2)
      const size = Math.floor(Math.min(img.width, img.height) * 0.2)
      const x0 = Math.max(0, cx - size)
      const y0 = Math.max(0, cy - size)
      const w = Math.min(img.width - x0, size * 2)
      const h = Math.min(img.height - y0, size * 2)

      const imageData = ctx.getImageData(x0, y0, w, h).data
      let bluePixels = 0
      let totalSamples = 0

      // Sample every 3rd pixel
      for (let i = 0; i < imageData.length; i += 12) {
        const r = imageData[i]
        const g = imageData[i + 1]
        const b = imageData[i + 2]
        const a = imageData[i + 3]

        if (a > 100) { // Only count non-transparent pixels
          totalSamples++
          
          // Detect blue color (any shade): blue must be dominant over red and green
          // More lenient criteria to detect various blue shades
          const isBlue = b > r && b > g && b > 60 && (b - r) > 10 && (b - g) > 10
          
          if (isBlue) {
            bluePixels++
          }
        }
      }

      // Positive if >15% of sampled pixels are blue
      const bluePercentage = totalSamples > 0 ? bluePixels / totalSamples : 0
      resolve(bluePercentage > 0.15 ? 'positive' : 'negative')
    }
    img.src = dataUrl
  })
}

/**
 * Detects Oxidase test result from tube image
 * Positive result shows purple/black color
 * Negative result shows colorless or light color
 */
export function detectOxidase(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise<'positive' | 'negative'>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Analyze center region of the tube
      const cx = Math.floor(img.width / 2)
      const cy = Math.floor(img.height / 2)
      const size = Math.floor(Math.min(img.width, img.height) * 0.2)
      const x0 = Math.max(0, cx - size)
      const y0 = Math.max(0, cy - size)
      const w = Math.min(img.width - x0, size * 2)
      const h = Math.min(img.height - y0, size * 2)

      const imageData = ctx.getImageData(x0, y0, w, h).data
      let purplePixels = 0
      let totalSamples = 0

      // Sample every 3rd pixel
      for (let i = 0; i < imageData.length; i += 12) {
        const r = imageData[i]
        const g = imageData[i + 1]
        const b = imageData[i + 2]
        const a = imageData[i + 3]

        if (a > 100) {
          totalSamples++
          // Calculate luminance
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b

          // Purple/black detection: dark (luminance < 100) OR
          // purple tone (R > G and B > G with moderate luminance)
          if (luminance < 100 || (r > g && b > g && luminance < 150)) {
            purplePixels++
          }
        }
      }

      // Positive if >25% of sampled pixels match purple criteria
      const purplePercentage = totalSamples > 0 ? purplePixels / totalSamples : 0
      resolve(purplePercentage > 0.25 ? 'positive' : 'negative')
    }
    img.src = dataUrl
  })
}
