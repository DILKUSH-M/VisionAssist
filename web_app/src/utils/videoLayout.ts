export interface CoverLayout {
  scale: number
  cropX: number
  cropY: number
  width: number
  height: number
}

export function getCoverLayout(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
): CoverLayout | null {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return null
  }

  const scale = Math.max(containerWidth / sourceWidth, containerHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    scale,
    cropX: (width - containerWidth) / 2,
    cropY: (height - containerHeight) / 2,
    width,
    height,
  }
}
