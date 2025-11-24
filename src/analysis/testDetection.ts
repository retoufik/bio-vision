/**
 * Automated biochemical test detection from tube images
 */

/**
 * Detect Coagulase result from tube image
 * Returns "positive" if clots/particles detected, "negative" if clear
 */
export function detectCoagulase(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Analyze the central tube region (where liquid would be)
      const centerX = Math.floor(canvas.width / 2)
      const centerY = Math.floor(canvas.height / 2)
      const tubeRadius = Math.min(canvas.width, canvas.height) / 6
      
      let particleCount = 0
      let clearPixels = 0
      
      // Sample pixels in circular region
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        for (let r = 0; r < tubeRadius; r += 2) {
          const x = Math.floor(centerX + r * Math.cos(angle))
          const y = Math.floor(centerY + r * Math.sin(angle))
          
          if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue
          
          const idx = (y * canvas.width + x) * 4
          const r_val = data[idx]
          const g_val = data[idx + 1]
          const b_val = data[idx + 2]
          const a_val = data[idx + 3]
          
          // Check if pixel is opaque (potential clot/particle)
          if (a_val > 200) {
            // Calculate luminance to detect variation from clear liquid
            const luminance = 0.299 * r_val + 0.587 * g_val + 0.114 * b_val
            
            // Check for dark particles or color variation (indicates clots/particles)
            const colorVariation = Math.abs(r_val - g_val) + Math.abs(g_val - b_val) + Math.abs(r_val - b_val)
            
            if (luminance < 150 || colorVariation > 60) {
              particleCount++
            } else if (luminance > 200 && colorVariation < 30) {
              clearPixels++
            }
          }
        }
      }
      
      // If particle count > clear pixels, it's positive (coagulated/turbid)
      const result = particleCount > clearPixels * 0.5 ? 'positive' : 'negative'
      resolve(result)
    }
    img.src = dataUrl
  })
}

/**
 * Detect Citrate result from tube image
 * Returns "positive" if blue detected, "negative" if not blue
 */
export function detectCitrate(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Analyze central region for color
      const centerX = Math.floor(canvas.width / 2)
      const centerY = Math.floor(canvas.height / 2)
      const sampleRadius = Math.min(canvas.width, canvas.height) / 8
      
      let blueCount = 0
      let totalSamples = 0
      
      // Sample pixels in central region
      for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x += 3) {
        for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y += 3) {
          if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue
          
          const idx = (y * canvas.width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          if (a < 100) continue // Skip transparent pixels
          
          totalSamples++
          
          // Blue detection: B > R and B > G, and significant blue component
          // Blue hue roughly: 180-240 degrees in HSL
          // RGB: B is dominant, R and G are lower
          if (b > r * 1.2 && b > g * 1.2 && b > 100) {
            blueCount++
          }
        }
      }
      
      // If more than 30% of pixels are blue, mark as positive
      const isBlue = totalSamples > 0 && (blueCount / totalSamples) > 0.3
      resolve(isBlue ? 'positive' : 'negative')
    }
    img.src = dataUrl
  })
}

/**
 * Detect Oxidase result from tube image
 * Returns "positive" if purple/black detected, "negative" if not
 */
export function detectOxidase(dataUrl: string): Promise<'positive' | 'negative'> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      const centerX = Math.floor(canvas.width / 2)
      const centerY = Math.floor(canvas.height / 2)
      const sampleRadius = Math.min(canvas.width, canvas.height) / 8
      
      let darkCount = 0
      let totalSamples = 0
      
      // Sample pixels for dark/purple coloration
      for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x += 3) {
        for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y += 3) {
          if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue
          
          const idx = (y * canvas.width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          if (a < 100) continue
          
          totalSamples++
          
          // Purple/black: low overall luminance with R and B dominating
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          const isPurpleOrBlack = luminance < 100 || (r > g && b > g && luminance < 150)
          
          if (isPurpleOrBlack) {
            darkCount++
          }
        }
      }
      
      const isPositive = totalSamples > 0 && (darkCount / totalSamples) > 0.25
      resolve(isPositive ? 'positive' : 'negative')
    }
    img.src = dataUrl
  })
}
