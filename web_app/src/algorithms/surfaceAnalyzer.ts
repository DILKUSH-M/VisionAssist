import type { SurfaceAssessment } from '../types'

let analysisCanvas: HTMLCanvasElement | null = null
let analysisContext: CanvasRenderingContext2D | null = null

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getAnalysisContext() {
  if (!analysisCanvas) {
    analysisCanvas = document.createElement('canvas')
    analysisContext = analysisCanvas.getContext('2d', { willReadFrequently: true })
  }

  return analysisContext
}

export function analyzeGroundSurface(video: HTMLVideoElement): SurfaceAssessment {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return {
      risk: 'Unavailable',
      score: 0,
      message: 'Surface analysis unavailable; do not rely on this reading.',
      anomalyScore: 0,
      contrastScore: 0,
    }
  }

  const width = Math.min(video.videoWidth || 320, 240)
  const height = Math.min(video.videoHeight || 180, 180)
  const ctx = getAnalysisContext()

  if (!ctx) {
    return {
      risk: 'Unavailable',
      score: 0,
      message: 'Surface analysis unavailable; do not rely on this reading.',
      anomalyScore: 0,
      contrastScore: 0,
    }
  }

  if (analysisCanvas && (analysisCanvas.width !== width || analysisCanvas.height !== height)) {
    analysisCanvas.width = width
    analysisCanvas.height = height
  }

  ctx.drawImage(video, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  const lowerY = Math.floor(height * 0.45)
  const lowerXStart = Math.floor(width * 0.2)
  const lowerXEnd = Math.floor(width * 0.8)
  let luminanceSum = 0
  let darkPixels = 0
  let contrastSum = 0
  let sampleCount = 0

  for (let y = lowerY; y < height; y += 2) {
    for (let x = lowerXStart; x < lowerXEnd; x += 2) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114)
      luminanceSum += lum
      sampleCount += 1

      if (lum < 70) darkPixels += 1

      const nx = x + 2
      const ny = y + 2
      const nextIndex = (Math.min(ny, height - 1) * width + Math.min(nx, width - 1)) * 4
      const nextLum =
        (data[nextIndex] * 0.299 + data[nextIndex + 1] * 0.587 + data[nextIndex + 2] * 0.114)

      contrastSum += Math.abs(lum - nextLum)
    }
  }

  const avgLuminance = luminanceSum / Math.max(sampleCount, 1)
  const darkRatio = darkPixels / Math.max(sampleCount, 1)
  const edgeDensity = contrastSum / Math.max(sampleCount, 1) / 255
  const anomalyScore = darkRatio * 0.7 + edgeDensity * 0.9 + Math.max(0, (90 - avgLuminance) / 90) * 0.6

  let risk: SurfaceAssessment['risk'] = 'Clear'
  let message = 'No strong surface anomaly found by the visual heuristic.'

  if (anomalyScore > 0.7) {
    risk = 'High'
    message = 'Strong visual ground anomaly; stop and assess the surface.'
  } else if (anomalyScore > 0.45) {
    risk = 'Medium'
    message = 'Possible uneven surface; proceed carefully and check the ground.'
  } else if (anomalyScore > 0.26) {
    risk = 'Low'
    message = 'Minor visual surface variation; continue with caution.'
  }

  return {
    risk,
    score: clamp(anomalyScore, 0, 1),
    message,
    anomalyScore: clamp(anomalyScore, 0, 1),
    contrastScore: clamp(edgeDensity, 0, 1),
  }
}
