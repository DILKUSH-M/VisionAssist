import type { BoundingBox, DetectionPosition } from '../types'
import { centerXOf, getPositionLabel, overlapsWithCorridor } from '../utils/helpers'

export function classifyObjectPosition(bbox: BoundingBox): DetectionPosition {
  const xCenter = centerXOf(bbox)
  return getPositionLabel(xCenter)
}

export function analyzeObjectPosition(bbox: BoundingBox) {
  const position = classifyObjectPosition(bbox)
  const corridorOverlap = overlapsWithCorridor(bbox)

  return {
    position,
    corridorOverlap,
    distanceFromCenter: Math.abs(centerXOf(bbox) - 0.5),
  }
}

export function scorePositionRisk(bbox: BoundingBox) {
  const { position, corridorOverlap, distanceFromCenter } = analyzeObjectPosition(bbox)
  let score = 20

  if (position === 'Center') score += 25
  if (position !== 'Center') score += (1 - distanceFromCenter) * 18
  if (corridorOverlap) score += 30

  return { position, corridorOverlap, score }
}
