import type { ObjectDetection } from '@tensorflow-models/coco-ssd'
import {
  expandBoxForRoi,
  mapRoiBoxToFrame,
  refinementConfidenceThreshold,
} from '../algorithms/roiRefinement'
import type { BoundingBox, DetectionObject } from '../types'

let modelPromise: Promise<ObjectDetection> | null = null
let tfRuntime: typeof import('@tensorflow/tfjs') | null = null
let modelLoadMs = 0
let roiCanvas: HTMLCanvasElement | null = null

const roiMaxDimension = 512

export async function loadDetectionModel() {
  if (!modelPromise) {
    const startedAt = performance.now()
    modelPromise = (async () => {
      const [tf, cocoSsd] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/coco-ssd'),
      ])
      await tf.ready()
      tfRuntime = tf
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
      })
      modelLoadMs = performance.now() - startedAt
      return model
    })().catch((error: unknown) => {
      modelPromise = null
      throw error
    })
  }

  return modelPromise
}

export async function detectObjectsFromVideo(
  video: HTMLVideoElement,
  threshold = 0.35,
) {
  const model = await loadDetectionModel()
  const inferenceStartedAt = performance.now()
  const predictions = await model.detect(video, undefined, threshold)
  const inferenceMs = performance.now() - inferenceStartedAt
  if (!tfRuntime) {
    throw new Error('TensorFlow.js runtime is unavailable after model initialization.')
  }
  const memory = tfRuntime.memory()

  return {
    detections: predictions.map((prediction, index) => ({
      id: `${prediction.class}-${index}-${Math.round(prediction.score * 100)}`,
      className: prediction.class,
      confidence: Number(prediction.score.toFixed(3)),
      bbox: {
        x: Number((prediction.bbox[0] / video.videoWidth).toFixed(4)),
        y: Number((prediction.bbox[1] / video.videoHeight).toFixed(4)),
        width: Number((prediction.bbox[2] / video.videoWidth).toFixed(4)),
        height: Number((prediction.bbox[3] / video.videoHeight).toFixed(4)),
      },
    })),
    modelLoadMs,
    inferenceMs,
    backend: tfRuntime.getBackend() ?? 'unknown',
    tensorMemoryBytes: memory.unreliable ? null : memory.numBytes,
  }
}

export async function refineDetectionFromVideo(
  video: HTMLVideoElement,
  detection: DetectionObject,
  threshold = 0.35,
) {
  const startedAt = performance.now()
  const roi = expandBoxForRoi(detection.bbox)
  if (!roi) return null

  const sourceX = roi.x * video.videoWidth
  const sourceY = roi.y * video.videoHeight
  const sourceWidth = roi.width * video.videoWidth
  const sourceHeight = roi.height * video.videoHeight
  const scale = Math.min(
    1,
    roiMaxDimension / Math.max(sourceWidth, sourceHeight),
  )
  const canvasWidth = Math.max(1, Math.round(sourceWidth * scale))
  const canvasHeight = Math.max(1, Math.round(sourceHeight * scale))

  if (!roiCanvas) roiCanvas = document.createElement('canvas')
  roiCanvas.width = canvasWidth
  roiCanvas.height = canvasHeight
  const context = roiCanvas.getContext('2d')
  if (!context) {
    throw new Error('ROI refinement could not create a 2D canvas context.')
  }
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvasWidth,
    canvasHeight,
  )

  const model = await loadDetectionModel()
  const predictions = await model.detect(
    roiCanvas,
    undefined,
    refinementConfidenceThreshold(detection.confidence, threshold),
  )
  const refined = predictions
    .filter((prediction) => prediction.class === detection.className)
    .map((prediction) => {
      const roiBox: BoundingBox = {
        x: prediction.bbox[0] / canvasWidth,
        y: prediction.bbox[1] / canvasHeight,
        width: prediction.bbox[2] / canvasWidth,
        height: prediction.bbox[3] / canvasHeight,
      }

      return {
        bbox: mapRoiBoxToFrame(
          detection.bbox,
          roi,
          roiBox,
          prediction.score,
          refinementConfidenceThreshold(detection.confidence, threshold),
        ),
        confidence: prediction.score,
      }
    })
    .filter(
      (candidate): candidate is { bbox: BoundingBox; confidence: number } =>
        candidate.bbox !== null,
    )
    .sort((first, second) => second.confidence - first.confidence)[0]

  return {
    bbox: refined?.bbox ?? null,
    confidence: refined?.confidence ?? null,
    latencyMs: performance.now() - startedAt,
  }
}

export function isTensorFlowAvailable() {
  return typeof window !== 'undefined' && !!window.fetch
}
