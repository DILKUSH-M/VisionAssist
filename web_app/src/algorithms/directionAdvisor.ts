import type { PathAssessment } from '../types'

export function suggestDirection(path: PathAssessment) {
  if (path.surface.risk === 'High') {
    return 'Strong visual ground anomaly ahead. Stop and assess the path.'
  }

  if (path.surface.risk === 'Medium') {
    return 'Possible surface anomaly ahead. Proceed carefully.'
  }

  if (path.centerBlocked) {
    if (path.leftBlocked && path.rightBlocked) {
      return 'Obstacle ahead and both side paths have detected obstacles. Stop.'
    }

    return path.rightBlocked
      ? 'Obstacle ahead. No obstacle detected in the left path.'
      : 'Obstacle ahead. No obstacle detected in the right path.'
  }

  if (path.leftBlocked && !path.rightBlocked) {
    return 'No obstacle detected in the right path.'
  }

  if (path.rightBlocked && !path.leftBlocked) {
    return 'No obstacle detected in the left path.'
  }

  if (path.leftBlocked && path.rightBlocked) {
    return 'Both side paths have detected obstacles. Stop.'
  }

  if (path.surface.risk === 'Unavailable') {
    return 'Surface analysis is unavailable. Do not rely on this reading.'
  }

  return path.surface.risk === 'Low'
    ? 'No obstacle detected in the visible path. Monitor the floor.'
    : 'No obstacle detected in the visible path.'
}
