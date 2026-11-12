import { analyzePath, withSurfaceAssessment } from '../algorithms/pathAnalyzer'
import { prioritizeHazard } from '../algorithms/hazardPrioritizer'
import { suggestDirection } from '../algorithms/directionAdvisor'
import { analyzeObjectPosition } from '../algorithms/positionAnalyzer'
import type { TrackedDetection } from '../algorithms/objectTracker'
import type {
  AssistAlert,
  DetectionObject,
  SurfaceAssessment,
} from '../types'
import { overlapsWithCorridor } from '../utils/helpers'

function estimateAvoidanceSteps(detection: DetectionObject) {
  const { width, height } = detection.bbox
  const apparentArea = width * height

  if (width >= 0.5 || apparentArea >= 0.3) return 4
  if (width >= 0.3 || apparentArea >= 0.14) return 3
  if (width >= 0.15 || apparentArea >= 0.04) return 2
  return 1
}

function getAvoidanceGuidance(
  detection: DetectionObject | undefined,
  path: ReturnType<typeof withSurfaceAssessment>,
) {
  if (!detection) return 'Obstacle detected ahead. Stop and assess your surroundings.'

  const obstaclePosition = detection.position.toLowerCase()
  const clearDirection = path.leftBlocked && path.rightBlocked
    ? null
    : path.leftBlocked
      ? 'right'
      : path.rightBlocked
        ? 'left'
        : detection.position === 'Left'
          ? 'right'
          : detection.position === 'Right'
            ? 'left'
            : 'right'

  if (!clearDirection) {
    return `${detection.className} detected ${detection.position === 'Center' ? 'ahead' : `on your ${obstaclePosition}`}. Both side paths have detected obstacles. Stop and seek assistance.`
  }

  const steps = estimateAvoidanceSteps(detection)
  const stepLabel = steps === 1 ? 'step' : 'steps'
  const location = detection.position === 'Center' ? 'ahead' : `on your ${obstaclePosition}`
  return `${detection.className} detected ${location}. The ${clearDirection} path appears clear of detected obstacles. Move about ${steps} ${stepLabel} to your ${clearDirection}.`
}

export function buildDetectionObjects(raw: TrackedDetection[]) {
  return raw.map((item) => {
    const positionData = analyzeObjectPosition(item.bbox)
    const priority = prioritizeHazard({
      ...item,
      position: positionData.position,
      centralCorridor: overlapsWithCorridor(item.bbox),
      priority: 'Low',
      persistenceFrames: item.persistenceFrames,
    })

    const detection: DetectionObject = {
      ...item,
      position: positionData.position,
      centralCorridor: positionData.corridorOverlap,
      priority,
      persistenceFrames: item.persistenceFrames,
    }

    return detection
  })
}

export function processDetections(
  rawDetections: TrackedDetection[],
  surface?: SurfaceAssessment,
) {
  const detections = buildDetectionObjects(rawDetections)
  const path = withSurfaceAssessment(analyzePath(detections), surface ?? {
    risk: 'Unavailable',
    score: 0,
    message: 'Surface analysis unavailable; do not rely on this reading.',
    anomalyScore: 0,
    contrastScore: 0,
  })
  let direction = suggestDirection(path)
  const topPriority = [...detections].sort((a, b) => {
    const order = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    return order[b.priority] - order[a.priority]
  })[0]
  let alert: AssistAlert | null = null

  if (path.surface.risk === 'High') {
    alert = { message: path.surface.message, priority: 'urgent' }
  } else if (path.surface.risk === 'Medium') {
    alert = { message: path.surface.message, priority: 'warning' }
  } else if (topPriority?.priority === 'Critical') {
    const guidance = getAvoidanceGuidance(topPriority, path)
    alert = {
      message: guidance,
      priority: 'urgent',
    }
  } else if (
    topPriority?.priority === 'High' &&
    topPriority.persistenceFrames >= 2
  ) {
    const guidance = getAvoidanceGuidance(topPriority, path)
    alert = {
      message: guidance,
      priority: 'warning',
    }
  } else if (topPriority?.centralCorridor) {
    const guidance = getAvoidanceGuidance(topPriority, path)
    alert = { message: guidance, priority: 'warning' }
  } else if (path.centerBlocked) {
    alert = {
      message: getAvoidanceGuidance(topPriority, path),
      priority: 'warning',
    }
  }

  if (alert && topPriority && alert.message !== path.surface.message) {
    direction = alert.message
  }

  return {
    detections,
    path,
    direction,
    alert,
    topPriority,
  }
}
