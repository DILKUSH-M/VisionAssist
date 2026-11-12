import type { DetectionObject, PathAssessment, SurfaceAssessment } from '../types'

const defaultSurface: SurfaceAssessment = {
  risk: 'Unavailable',
  score: 0,
  message: 'Surface analysis unavailable; do not rely on this reading.',
  anomalyScore: 0,
  contrastScore: 0,
}

function laneIsBlocked(
  detections: DetectionObject[],
  laneStart: number,
  laneEnd: number,
) {
  return detections.some(({ bbox }) => {
    const boxRight = bbox.x + bbox.width
    const boxBottom = bbox.y + bbox.height
    const horizontalOverlap = Math.max(
      0,
      Math.min(boxRight, laneEnd) - Math.max(bbox.x, laneStart),
    )

    return boxBottom >= 0.45 && horizontalOverlap / Math.max(bbox.width, 0.001) >= 0.25
  })
}

export function analyzePath(detections: DetectionObject[]): PathAssessment {
  const leftBlocked = laneIsBlocked(detections, 0, 1 / 3)
  const centerBlocked = laneIsBlocked(detections, 1 / 3, 2 / 3)
  const rightBlocked = laneIsBlocked(detections, 2 / 3, 1)

  let suggestedDirection = 'No obstacle detected in the visible path.'
  if (centerBlocked) {
    if (leftBlocked && rightBlocked) {
      suggestedDirection = 'Obstacle ahead and both side paths have detected obstacles. Stop.'
    } else if (leftBlocked) {
      suggestedDirection = 'Obstacle ahead. No obstacle detected in the right path.'
    } else if (rightBlocked) {
      suggestedDirection = 'Obstacle ahead. No obstacle detected in the left path.'
    } else {
      suggestedDirection = 'Obstacle ahead. No obstacle detected in the right path.'
    }
  } else if (leftBlocked && !rightBlocked) {
    suggestedDirection = 'No obstacle detected in the right path.'
  } else if (rightBlocked && !leftBlocked) {
    suggestedDirection = 'No obstacle detected in the left path.'
  } else if (leftBlocked && rightBlocked) {
    suggestedDirection = 'Both side paths have detected obstacles. Stop.'
  }

  return {
    leftBlocked,
    centerBlocked,
    rightBlocked,
    suggestedDirection,
    summary: `${leftBlocked ? 'left obstacle' : 'no left obstacle'} / ${centerBlocked ? 'center obstacle' : 'no center obstacle'} / ${rightBlocked ? 'right obstacle' : 'no right obstacle'}`,
    surface: defaultSurface,
  }
}

export function withSurfaceAssessment(
  path: PathAssessment,
  surface: SurfaceAssessment,
): PathAssessment {
  return {
    ...path,
    surface,
    suggestedDirection:
      surface.risk === 'Medium' || surface.risk === 'High'
        ? `${surface.message} ${path.suggestedDirection}`
        : path.suggestedDirection,
  }
}
