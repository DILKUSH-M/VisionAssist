import { describe, expect, it } from 'vitest'
import { prioritizeHazard } from './hazardPrioritizer'
import { ObjectTracker } from './objectTracker'
import { classifyObjectPosition, analyzeObjectPosition } from './positionAnalyzer'
import { processDetections } from '../services/processingService'
import { getCoverLayout } from '../utils/videoLayout'
import {
  expandBoxForRoi,
  mapRoiBoxToFrame,
  refinementConfidenceThreshold,
} from './roiRefinement'
import type { DetectionObject } from '../types'

function makeDetection(
  overrides: Partial<DetectionObject> = {},
): DetectionObject {
  return {
    id: 'test',
    className: 'person',
    confidence: 0.9,
    bbox: { x: 0.4, y: 0.5, width: 0.2, height: 0.3 },
    position: 'Center',
    centralCorridor: true,
    priority: 'Low',
    persistenceFrames: 1,
    ...overrides,
  }
}

describe('position analysis', () => {
  it('classifies normalized boxes into left, center, and right regions', () => {
    expect(classifyObjectPosition({ x: 0.05, y: 0, width: 0.2, height: 0.2 })).toBe('Left')
    expect(classifyObjectPosition({ x: 0.4, y: 0, width: 0.2, height: 0.2 })).toBe('Center')
    expect(classifyObjectPosition({ x: 0.75, y: 0, width: 0.2, height: 0.2 })).toBe('Right')
  })

  it('checks corridor intersection independently of center classification', () => {
    const result = analyzeObjectPosition({
      x: 0.18,
      y: 0.5,
      width: 0.1,
      height: 0.2,
    })

    expect(result.position).toBe('Left')
    expect(result.corridorOverlap).toBe(true)
  })
})

describe('hazard prioritization', () => {
  it('raises a large, persistent vehicle in the central corridor to critical', () => {
    const detection = makeDetection({
      className: 'car',
      confidence: 0.95,
      bbox: { x: 0.3, y: 0.35, width: 0.4, height: 0.5 },
      persistenceFrames: 4,
    })

    expect(prioritizeHazard(detection)).toBe('Critical')
  })

  it('does not make a high-confidence generic class critical by confidence alone', () => {
    const detection = makeDetection({
      className: 'unknown object',
      confidence: 0.99,
      bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.7 },
      persistenceFrames: 1,
    })

    expect(prioritizeHazard(detection)).not.toBe('Critical')
  })
})

describe('object tracking', () => {
  it('keeps an object identity and increments persistence for overlapping detections', () => {
    const tracker = new ObjectTracker()
    const initial = tracker.update([
      {
        id: 'raw-1',
        className: 'chair',
        confidence: 0.8,
        bbox: { x: 0.3, y: 0.4, width: 0.2, height: 0.3 },
      },
    ])
    const next = tracker.update([
      {
        id: 'raw-2',
        className: 'chair',
        confidence: 0.82,
        bbox: { x: 0.31, y: 0.4, width: 0.2, height: 0.3 },
      },
    ])

    expect(next[0].id).toBe(initial[0].id)
    expect(next[0].persistenceFrames).toBe(2)
  })

  it('does not associate detections of different classes', () => {
    const tracker = new ObjectTracker()
    const initial = tracker.update([
      {
        id: 'raw-1',
        className: 'chair',
        confidence: 0.8,
        bbox: { x: 0.3, y: 0.4, width: 0.2, height: 0.3 },
      },
    ])
    const next = tracker.update([
      {
        id: 'raw-2',
        className: 'dining table',
        confidence: 0.8,
        bbox: { x: 0.3, y: 0.4, width: 0.2, height: 0.3 },
      },
    ])

    expect(next[0].id).not.toBe(initial[0].id)
    expect(next[0].persistenceFrames).toBe(1)
  })
})

describe('alert generation', () => {
  it('gives a persistent center obstacle an approximate avoidance direction and step count', () => {
    const raw = {
      id: 'chair-track',
      className: 'chair',
      confidence: 0.9,
      bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.4 },
    }
    const surface = {
      risk: 'Clear' as const,
      score: 0,
      message: 'No strong surface anomaly found by the visual heuristic.',
      anomalyScore: 0,
      contrastScore: 0,
    }

    const firstFrame = processDetections([{ ...raw, persistenceFrames: 1 }], surface)
    const secondFrame = processDetections([{ ...raw, persistenceFrames: 2 }], surface)

    expect(firstFrame.alert?.message).toBe(
      'chair detected ahead. The right path appears clear of detected obstacles. Move about 2 steps to your right.',
    )
    expect(secondFrame.alert?.message).toBe(
      'chair detected ahead. The right path appears clear of detected obstacles. Move about 2 steps to your right.',
    )
    expect(secondFrame.direction).toBe(secondFrame.alert?.message)
  })

  it('recommends moving away from a left-side obstacle and increases the estimate for a wide object', () => {
    const result = processDetections(
      [{
        id: 'wide-obstacle',
        className: 'chair',
        confidence: 0.9,
        bbox: { x: 0.05, y: 0.3, width: 0.35, height: 0.5 },
        persistenceFrames: 2,
      }],
      {
        risk: 'Clear',
        score: 0,
        message: 'No strong surface anomaly found by the visual heuristic.',
        anomalyScore: 0,
        contrastScore: 0,
      },
    )

    expect(result.alert?.message).toBe(
      'chair detected on your left. The right path appears clear of detected obstacles. Move about 3 steps to your right.',
    )
  })

  it('scales the step estimate from one to four with the apparent obstacle size', () => {
    const surface = {
      risk: 'Clear' as const,
      score: 0,
      message: 'No strong surface anomaly found by the visual heuristic.',
      anomalyScore: 0,
      contrastScore: 0,
    }

    const small = processDetections([{
      id: 'small-obstacle',
      className: 'book',
      confidence: 0.9,
      bbox: { x: 0.45, y: 0.6, width: 0.1, height: 0.2 },
      persistenceFrames: 1,
    }], surface)
    const veryLarge = processDetections([{
      id: 'very-large-obstacle',
      className: 'person',
      confidence: 0.9,
      bbox: { x: 0.05, y: 0.1, width: 0.4, height: 0.8 },
      persistenceFrames: 1,
    }], surface)

    expect(small.alert?.message).toContain('Move about 1 step to your right')
    expect(veryLarge.alert?.message).toContain('Move about 4 steps to your right')
  })

  it('does not recommend a side when detections obstruct both side paths', () => {
    const result = processDetections(
      [
        {
          id: 'center-obstacle',
          className: 'chair',
          confidence: 0.9,
          bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.4 },
          persistenceFrames: 1,
        },
        {
          id: 'left-obstacle',
          className: 'chair',
          confidence: 0.5,
          bbox: { x: 0.05, y: 0.3, width: 0.25, height: 0.5 },
          persistenceFrames: 1,
        },
        {
          id: 'right-obstacle',
          className: 'chair',
          confidence: 0.5,
          bbox: { x: 0.7, y: 0.3, width: 0.25, height: 0.5 },
          persistenceFrames: 1,
        },
      ],
      {
        risk: 'Clear',
        score: 0,
        message: 'No strong surface anomaly found by the visual heuristic.',
        anomalyScore: 0,
        contrastScore: 0,
      },
    )

    expect(result.path.leftBlocked).toBe(true)
    expect(result.path.rightBlocked).toBe(true)
    expect(result.alert?.message).toContain('Both side paths have detected obstacles. Stop')
  })

  it('recommends the left path when a center obstacle is detected and the right lane is blocked', () => {
    const result = processDetections(
      [
        {
          id: 'center-obstacle',
          className: 'chair',
          confidence: 0.9,
          bbox: { x: 0.4, y: 0.4, width: 0.2, height: 0.4 },
          persistenceFrames: 1,
        },
        {
          id: 'right-obstacle',
          className: 'chair',
          confidence: 0.5,
          bbox: { x: 0.7, y: 0.3, width: 0.25, height: 0.5 },
          persistenceFrames: 1,
        },
      ],
      {
        risk: 'Clear',
        score: 0,
        message: 'No strong surface anomaly found by the visual heuristic.',
        anomalyScore: 0,
        contrastScore: 0,
      },
    )

    expect(result.path.leftBlocked).toBe(false)
    expect(result.path.rightBlocked).toBe(true)
    expect(result.alert?.message).toContain('The left path appears clear of detected obstacles')
    expect(result.alert?.message).toContain('Move about 2 steps to your left')
  })

})

describe('camera overlay geometry', () => {
  it('maps a landscape source using the same centered cover crop as the preview', () => {
    const layout = getCoverLayout(1280, 720, 360, 640)

    expect(layout).not.toBeNull()
    expect(layout?.cropX).toBeCloseTo(388.89, 1)
    expect(layout?.cropY).toBe(0)
    expect(0.5 * (layout?.width ?? 0) - (layout?.cropX ?? 0)).toBeCloseTo(180, 1)
  })

  it('returns no layout until source and viewport dimensions are available', () => {
    expect(getCoverLayout(0, 720, 360, 640)).toBeNull()
  })
})

describe('ROI box refinement', () => {
  it('expands an ROI while keeping it inside the normalized frame', () => {
    const roi = expandBoxForRoi({
      x: 0.02,
      y: 0.1,
      width: 0.4,
      height: 0.5,
    })

    expect(roi?.x).toBe(0)
    expect(roi?.y).toBeCloseTo(0.04)
    expect(roi?.width).toBeCloseTo(0.468)
    expect(roi?.height).toBeCloseTo(0.62)
  })

  it('maps a smaller ROI detection into full-frame coordinates', () => {
    const original = { x: 0.2, y: 0.2, width: 0.4, height: 0.5 }
    const roi = { x: 0.152, y: 0.14, width: 0.496, height: 0.62 }
    const roiBox = { x: 0.1, y: 0.1, width: 0.7, height: 0.7 }

    const mapped = mapRoiBoxToFrame(original, roi, roiBox, 0.8, 0.4)

    expect(mapped?.x).toBeCloseTo(0.2016)
    expect(mapped?.y).toBeCloseTo(0.202)
    expect(mapped?.width).toBeCloseTo(0.3472)
    expect(mapped?.height).toBeCloseTo(0.434)
  })

  it('falls back for weak, oversized, or unrelated ROI predictions', () => {
    const original = { x: 0.2, y: 0.2, width: 0.4, height: 0.5 }
    const roi = { x: 0.152, y: 0.14, width: 0.496, height: 0.62 }

    expect(
      mapRoiBoxToFrame(
        original,
        roi,
        { x: 0, y: 0, width: 1, height: 1 },
        0.8,
        0.4,
      ),
    ).toBeNull()
    expect(
      mapRoiBoxToFrame(
        original,
        roi,
        { x: 0, y: 0, width: 0.3, height: 0.3 },
        0.8,
        0.4,
      ),
    ).toBeNull()
    expect(
      mapRoiBoxToFrame(
        original,
        roi,
        { x: 0.8, y: 0.8, width: 0.1, height: 0.1 },
        0.8,
        0.4,
      ),
    ).toBeNull()
    expect(refinementConfidenceThreshold(0.9, 0.4)).toBeCloseTo(0.75)
  })

  it('keeps ROI estimates separate from hazard-analysis coordinates', () => {
    const original = {
      id: 'refined-track',
      className: 'chair',
      confidence: 0.9,
      bbox: { x: 0.2, y: 0.2, width: 0.4, height: 0.5 },
      persistenceFrames: 3,
      refinedBbox: { x: 0.25, y: 0.25, width: 0.3, height: 0.4 },
      refinementConfidence: 0.82,
    }

    const processed = processDetections([original])

    expect(processed.detections[0].bbox).toEqual(original.bbox)
    expect(processed.detections[0].refinedBbox).toEqual(original.refinedBbox)
    expect(processed.detections[0].centralCorridor).toBe(true)
  })
})
