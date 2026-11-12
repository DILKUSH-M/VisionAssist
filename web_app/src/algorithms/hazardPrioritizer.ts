import type { DetectionObject, HazardPriority } from '../types'

export const HAZARD_SCORE_WEIGHTS = {
  classRisk: 25,
  confidence: 15,
  centeredPosition: 15,
  corridorOverlap: 25,
  apparentSize: 15,
  persistence: 5,
}

const classRisk: Record<string, number> = {
  car: 0.9,
  motorcycle: 0.9,
  bus: 0.9,
  truck: 0.9,
  bicycle: 0.8,
  person: 0.55,
  chair: 0.65,
  'dining table': 0.6,
  bench: 0.65,
  suitcase: 0.6,
  backpack: 0.45,
  dog: 0.5,
}

const priorityThresholds = {
  Critical: 80,
  High: 60,
  Medium: 40,
}

export function calculateHazardScore(detection: DetectionObject) {
  const weights = HAZARD_SCORE_WEIGHTS
  const boxArea = detection.bbox.width * detection.bbox.height
  const distanceFromCenter = Math.abs(
    detection.bbox.x + detection.bbox.width / 2 - 0.5,
  )
  const centerFactor = Math.max(0, 1 - distanceFromCenter * 2)
  const sizeFactor = Math.min(boxArea / 0.15, 1)
  const persistenceFactor = Math.min(detection.persistenceFrames / 4, 1)
  const classFactor = classRisk[detection.className.toLowerCase()] ?? 0.25

  return (
    classFactor * weights.classRisk +
    detection.confidence * weights.confidence +
    centerFactor * weights.centeredPosition +
    Number(detection.centralCorridor) * weights.corridorOverlap +
    sizeFactor * weights.apparentSize +
    persistenceFactor * weights.persistence
  )
}

export function prioritizeHazard(detection: DetectionObject): HazardPriority {
  const score = calculateHazardScore(detection)

  if (score >= priorityThresholds.Critical) return 'Critical'
  if (score >= priorityThresholds.High) return 'High'
  if (score >= priorityThresholds.Medium) return 'Medium'
  return 'Low'
}
