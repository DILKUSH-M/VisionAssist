import type { BoundingBox, DetectionPosition } from '../types'

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function formatConfidence(value: number) {
  return `${(value * 100).toFixed(0)}%`
}

export function addAlpha(hex: string, opacity: number) {
  const safeOpacity = clamp(opacity, 0, 1)
  const sanitized = hex.replace('#', '')

  if (sanitized.length === 3) {
    return `#${sanitized
      .split('')
      .map((char) => char + char)
      .join('')}${Math.round(safeOpacity * 255)
      .toString(16)
      .padStart(2, '0')}`
  }

  if (sanitized.length === 6) {
    const alphaHex = Math.round(safeOpacity * 255)
      .toString(16)
      .padStart(2, '0')
    return `#${sanitized}${alphaHex}`
  }

  return hex
}

export function getPositionLabel(x: number): DetectionPosition {
  if (x < 0.33) return 'Left'
  if (x > 0.67) return 'Right'
  return 'Center'
}

export function overlapsWithCorridor(bbox: BoundingBox) {
  const corridorLeft = 0.2
  const corridorRight = 0.8
  const corridorTop = 0.18
  const corridorBottom = 0.9
  const boxRight = bbox.x + bbox.width
  const boxBottom = bbox.y + bbox.height

  return (
    boxRight > corridorLeft &&
    bbox.x < corridorRight &&
    boxBottom > corridorTop &&
    bbox.y < corridorBottom
  )
}

export function centerXOf(bbox: BoundingBox) {
  return bbox.x + bbox.width / 2
}

export function centerYOf(bbox: BoundingBox) {
  return bbox.y + bbox.height / 2
}

export function estimateSizeScore(bbox: BoundingBox) {
  return (bbox.width * bbox.height) * 100
}
