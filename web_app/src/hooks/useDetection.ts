import { useEffect, useRef, useState } from 'react'
import { intersectionOverUnion, ObjectTracker } from '../algorithms/objectTracker'
import { analyzeGroundSurface } from '../algorithms/surfaceAnalyzer'
import type {
  AssistAlert,
  BoundingBox,
  DetectionObject,
  PathAssessment,
  PipelineMetrics,
  SurfaceAssessment,
} from '../types'
import {
  detectObjectsFromVideo,
  loadDetectionModel,
  refineDetectionFromVideo,
} from '../services/detectionService'
import { processDetections } from '../services/processingService'

const targetIntervalMs = 450
const refinementIntervalFrames = 5
const minimumRefinementPersistence = 3
const refinementCacheFrames = 5
const minimumRefinementBoxOverlap = 0.75
const metricsWindowSize = 20

interface CachedRefinement {
  sourceBbox: BoundingBox
  refinedBbox: BoundingBox
  confidence: number
  frame: number
}

interface FrameMetricsSample {
  inferenceMs: number
  refinementMs: number
  surfaceAnalysisMs: number
  postProcessingMs: number
  totalMs: number
  processingFps: number
  confidenceSum: number
  confidenceCount: number
}

export function useDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  threshold = 0.35,
) {
  const [detections, setDetections] = useState<DetectionObject[]>([])
  const [path, setPath] = useState<PathAssessment | null>(null)
  const [direction, setDirection] = useState('Path appears clear.')
  const [surface, setSurface] = useState<SurfaceAssessment | null>(null)
  const [alert, setAlert] = useState<AssistAlert | null>(null)
  const [status, setStatus] = useState('Idle')
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
  const trackerRef = useRef(new ObjectTracker())
  const refinementCacheRef = useRef(new Map<string, CachedRefinement>())
  const metricsSamplesRef = useRef<FrameMetricsSample[]>([])

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      return undefined
    }

    refinementCacheRef.current.clear()
    metricsSamplesRef.current = []
    let cancelled = false
    let running = false
    let timeoutId: number | undefined
    let previousStart: number | null = null
    let frameNumber = 0

    void loadDetectionModel().catch((error: unknown) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : 'Unknown model loading error.'
        setStatus(`Detection failed: ${message}`)
      }
    })

    const scheduleNext = (delay: number) => {
      if (!cancelled) {
        timeoutId = window.setTimeout(() => {
          void runFrame()
        }, delay)
      }
    }

    const runFrame = async () => {
      if (cancelled || running) return

      const video = videoRef.current
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        scheduleNext(200)
        return
      }

      running = true
      const startedAt = performance.now()
      frameNumber += 1
      const cadenceFps = previousStart === null
        ? 0
        : 1000 / Math.max(startedAt - previousStart, 1)
      previousStart = startedAt

      try {
        const detectionResult = await detectObjectsFromVideo(video, threshold)
        const surfaceStartedAt = performance.now()
        const detectedSurface = analyzeGroundSurface(video)
        const surfaceAnalysisMs = performance.now() - surfaceStartedAt
        const postProcessingStartedAt = performance.now()
        const tracked = trackerRef.current.update(detectionResult.detections)
        const processed = processDetections(tracked, detectedSurface)

        for (const [id, cached] of refinementCacheRef.current) {
          const current = processed.detections.find((detection) => detection.id === id)
          if (
            !current ||
            frameNumber - cached.frame > refinementCacheFrames ||
            intersectionOverUnion(cached.sourceBbox, current.bbox) <
              minimumRefinementBoxOverlap
          ) {
            refinementCacheRef.current.delete(id)
          }
        }

        let refinementMs = 0
        let refinementError: string | null = null
        if (frameNumber % refinementIntervalFrames === 0) {
          const candidate = [...processed.detections]
            .filter(
              (detection) =>
                detection.persistenceFrames >= minimumRefinementPersistence,
            )
            .sort((first, second) => {
              const corridorOrder =
                Number(second.centralCorridor) - Number(first.centralCorridor)
              if (corridorOrder !== 0) return corridorOrder
              return second.confidence - first.confidence
            })[0]

          if (candidate) {
            try {
              const refinement = await refineDetectionFromVideo(
                video,
                candidate,
                threshold,
              )
              if (refinement) {
                refinementMs = refinement.latencyMs
                if (refinement.bbox && refinement.confidence !== null) {
                  refinementCacheRef.current.set(candidate.id, {
                    sourceBbox: candidate.bbox,
                    refinedBbox: refinement.bbox,
                    confidence: refinement.confidence,
                    frame: frameNumber,
                  })
                }
              }
            } catch (error) {
              refinementError =
                error instanceof Error ? error.message : 'Unknown ROI refinement error.'
            }
          }
        }

        const detectionsWithRefinements = processed.detections.map((detection) => {
          const cached = refinementCacheRef.current.get(detection.id)
          if (
            !cached ||
            intersectionOverUnion(cached.sourceBbox, detection.bbox) <
              minimumRefinementBoxOverlap
          ) {
            return detection
          }

          return {
            ...detection,
            refinedBbox: cached.refinedBbox,
            refinementConfidence: cached.confidence,
          }
        })
        const postProcessingMs = performance.now() - postProcessingStartedAt
        const totalMs = performance.now() - startedAt

        if (!cancelled) {
          const confidenceValues = detectionResult.detections.map(
            (detection) => detection.confidence,
          )
          metricsSamplesRef.current.push({
            inferenceMs: detectionResult.inferenceMs,
            refinementMs,
            surfaceAnalysisMs,
            postProcessingMs,
            totalMs,
            processingFps: cadenceFps,
            confidenceSum: confidenceValues.reduce((sum, value) => sum + value, 0),
            confidenceCount: confidenceValues.length,
          })
          if (metricsSamplesRef.current.length > metricsWindowSize) {
            metricsSamplesRef.current.shift()
          }

          const samples = metricsSamplesRef.current
          const average = (select: (sample: FrameMetricsSample) => number) =>
            samples.reduce((sum, sample) => sum + select(sample), 0) /
            samples.length
          const fpsSamples = samples.filter((sample) => sample.processingFps > 0)
          const totalConfidence = samples.reduce(
            (sum, sample) => sum + sample.confidenceSum,
            0,
          )
          const confidenceCount = samples.reduce(
            (sum, sample) => sum + sample.confidenceCount,
            0,
          )

          setDetections(detectionsWithRefinements)
          setPath(processed.path)
          setSurface(detectedSurface)
          setDirection(processed.direction)
          setAlert(processed.alert)
          setMetrics({
            modelLoadMs: detectionResult.modelLoadMs,
            inferenceMs: average((sample) => sample.inferenceMs),
            refinementMs: average((sample) => sample.refinementMs),
            surfaceAnalysisMs: average((sample) => sample.surfaceAnalysisMs),
            postProcessingMs: average((sample) => sample.postProcessingMs),
            totalMs: average((sample) => sample.totalMs),
            processingFps:
              fpsSamples.reduce((sum, sample) => sum + sample.processingFps, 0) /
              Math.max(fpsSamples.length, 1),
            averageConfidence: confidenceCount
              ? totalConfidence / confidenceCount
              : null,
            backend: detectionResult.backend,
            tensorMemoryBytes: detectionResult.tensorMemoryBytes,
          })
          setStatus(
            refinementError
              ? `Detected ${processed.detections.length} objects; ROI refinement skipped: ${refinementError}`
              : `Detected ${processed.detections.length} objects`,
          )
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unknown detection error.'
          setStatus(`Detection failed: ${message}`)
        }
      } finally {
        running = false
        if (!cancelled) {
          const workMs = performance.now() - startedAt
          scheduleNext(Math.max(0, targetIntervalMs - workMs))
        }
      }
    }

    void runFrame()

    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [enabled, threshold, videoRef])

  return {
    detections,
    path,
    direction,
    surface,
    alert,
    status,
    metrics,
  }
}
