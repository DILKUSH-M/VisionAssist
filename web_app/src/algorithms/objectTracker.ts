import type { BoundingBox } from '../types'

export interface RawDetection {
  id: string
  className: string
  confidence: number
  bbox: BoundingBox
}

export interface TrackedDetection extends RawDetection {
  persistenceFrames: number
}

interface Track {
  id: string
  className: string
  bbox: BoundingBox
  persistenceFrames: number
  missedFrames: number
}

export function intersectionOverUnion(first: BoundingBox, second: BoundingBox) {
  const left = Math.max(first.x, second.x)
  const top = Math.max(first.y, second.y)
  const right = Math.min(first.x + first.width, second.x + second.width)
  const bottom = Math.min(first.y + first.height, second.y + second.height)
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top)
  const firstArea = first.width * first.height
  const secondArea = second.width * second.height
  const union = firstArea + secondArea - intersection

  return union > 0 ? intersection / union : 0
}

export class ObjectTracker {
  private tracks: Track[] = []
  private nextId = 1

  update(detections: RawDetection[]): TrackedDetection[] {
    const unmatchedTrackIds = new Set(this.tracks.map((track) => track.id))
    const nextTracks: Track[] = []

    const updatedDetections = detections.map((detection) => {
      let bestTrack: Track | undefined
      let bestOverlap = 0.3

      for (const track of this.tracks) {
        if (
          !unmatchedTrackIds.has(track.id) ||
          track.className !== detection.className
        ) {
          continue
        }

        const overlap = intersectionOverUnion(track.bbox, detection.bbox)
        if (overlap > bestOverlap) {
          bestOverlap = overlap
          bestTrack = track
        }
      }

      const track: Track = bestTrack
        ? {
            ...bestTrack,
            bbox: detection.bbox,
            persistenceFrames: bestTrack.persistenceFrames + 1,
            missedFrames: 0,
          }
        : {
            id: `track-${this.nextId++}`,
            className: detection.className,
            bbox: detection.bbox,
            persistenceFrames: 1,
            missedFrames: 0,
          }

      if (bestTrack) unmatchedTrackIds.delete(bestTrack.id)
      nextTracks.push(track)

      return {
        ...detection,
        id: track.id,
        persistenceFrames: track.persistenceFrames,
      }
    })

    for (const track of this.tracks) {
      if (unmatchedTrackIds.has(track.id) && track.missedFrames < 1) {
        nextTracks.push({ ...track, missedFrames: track.missedFrames + 1 })
      }
    }

    this.tracks = nextTracks
    return updatedDetections
  }

  reset() {
    this.tracks = []
    this.nextId = 1
  }
}
