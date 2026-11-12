import type { BoundingBox } from '../types'

const roiPaddingRatio = 0.12
const minimumRefinedAreaRatio = 0.25
const maximumRefinedAreaRatio = 0.98
const minimumContainedAreaRatio = 0.9
const confidenceDropTolerance = 0.15

function isValidBox(box: BoundingBox) {
  return (
    Number.isFinite(box.x) &&
    Number.isFinite(box.y) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height) &&
    box.width > 0 &&
    box.height > 0
  )
}

export function expandBoxForRoi(box: BoundingBox): BoundingBox | null {
  if (!isValidBox(box)) return null

  const paddingX = box.width * roiPaddingRatio
  const paddingY = box.height * roiPaddingRatio
  const left = Math.max(0, box.x - paddingX)
  const top = Math.max(0, box.y - paddingY)
  const right = Math.min(1, box.x + box.width + paddingX)
  const bottom = Math.min(1, box.y + box.height + paddingY)

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

export function mapRoiBoxToFrame(
  original: BoundingBox,
  roi: BoundingBox,
  roiBox: BoundingBox,
  roiConfidence: number,
  minimumConfidence: number,
): BoundingBox | null {
  if (!isValidBox(original) || !isValidBox(roi) || !isValidBox(roiBox)) {
    return null
  }
  if (
    !Number.isFinite(roiConfidence) ||
    roiConfidence < Math.max(minimumConfidence, 0)
  ) {
    return null
  }

  const mapped = {
    x: roi.x + roiBox.x * roi.width,
    y: roi.y + roiBox.y * roi.height,
    width: roiBox.width * roi.width,
    height: roiBox.height * roi.height,
  }
  const originalArea = original.width * original.height
  const refinedArea = mapped.width * mapped.height
  const centerX = mapped.x + mapped.width / 2
  const centerY = mapped.y + mapped.height / 2
  const overlapWidth = Math.max(
    0,
    Math.min(original.x + original.width, mapped.x + mapped.width) -
      Math.max(original.x, mapped.x),
  )
  const overlapHeight = Math.max(
    0,
    Math.min(original.y + original.height, mapped.y + mapped.height) -
      Math.max(original.y, mapped.y),
  )
  const containedAreaRatio =
    refinedArea > 0 ? (overlapWidth * overlapHeight) / refinedArea : 0

  if (
    centerX < original.x ||
    centerX > original.x + original.width ||
    centerY < original.y ||
    centerY > original.y + original.height ||
    refinedArea < originalArea * minimumRefinedAreaRatio ||
    refinedArea >= originalArea * maximumRefinedAreaRatio ||
    containedAreaRatio < minimumContainedAreaRatio
  ) {
    return null
  }

  return mapped
}

export function refinementConfidenceThreshold(
  originalConfidence: number,
  minimumConfidence: number,
) {
  return Math.max(minimumConfidence, originalConfidence - confidenceDropTolerance)
}
