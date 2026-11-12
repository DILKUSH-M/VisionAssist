import { useEffect, useRef, useState } from 'react'
import type { DetectionObject, PathAssessment } from '../types'
import { formatConfidence } from '../utils/helpers'
import { getCoverLayout, type CoverLayout } from '../utils/videoLayout'

interface DetectionOverlayProps {
  detections: DetectionObject[]
  path: PathAssessment | null
  videoRef: React.RefObject<HTMLVideoElement | null>
}

const lanes = [
  { name: 'Left', blocked: (path: PathAssessment) => path.leftBlocked },
  { name: 'Center', blocked: (path: PathAssessment) => path.centerBlocked },
  { name: 'Right', blocked: (path: PathAssessment) => path.rightBlocked },
]

function getLaneStyle(index: number, layout: CoverLayout) {
  const laneStart = index / 3
  const laneEnd = (index + 1) / 3

  const left = laneStart * layout.width - layout.cropX
  const right = laneEnd * layout.width - layout.cropX
  const top = 0.45 * layout.height - layout.cropY

  return {
    left: `${left}px`,
    width: `${right - left}px`,
    top: `${top}px`,
    height: `${layout.height - top - layout.cropY}px`,
  }
}

export function DetectionOverlay({ detections, path, videoRef }: DetectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<CoverLayout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return undefined

    const updateLayout = () => {
      const bounds = overlay.getBoundingClientRect()
      setLayout(
        getCoverLayout(
          video.videoWidth,
          video.videoHeight,
          bounds.width,
          bounds.height,
        ),
      )
    }

    const observer = new ResizeObserver(updateLayout)
    observer.observe(overlay)
    video.addEventListener('loadedmetadata', updateLayout)
    updateLayout()

    return () => {
      observer.disconnect()
      video.removeEventListener('loadedmetadata', updateLayout)
    }
  }, [videoRef])

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute right-2 top-2 z-10 rounded-full bg-slate-950/80 px-2 py-1 text-[9px] font-medium text-slate-100">
        Dashed: COCO-SSD · Solid: ROI estimate
      </span>
      {layout && lanes.map((lane, index) => {
        const blocked = path ? lane.blocked(path) : null
        const laneClass = blocked === null
          ? 'bg-slate-300/5'
          : blocked
            ? 'bg-rose-500/10'
            : 'bg-emerald-400/5'

        return (
          <div
            key={lane.name}
            className={`absolute border-r border-white/20 ${laneClass}`}
            style={getLaneStyle(index, layout)}
          >
            <span className="absolute bottom-1 left-1 rounded bg-slate-950/75 px-1.5 py-0.5 text-[9px] font-medium text-slate-100">
              {lane.name}: {blocked === null ? 'Scanning' : blocked ? 'Obstacle detected' : 'No obstacle detected'}
            </span>
          </div>
        )
      })}

      {layout && detections.map((item) => {
        const getBoxStyle = (bbox: typeof item.bbox) => ({
          left: `${bbox.x * layout.width - layout.cropX}px`,
          top: `${bbox.y * layout.height - layout.cropY}px`,
          width: `${bbox.width * layout.width}px`,
          height: `${bbox.height * layout.height}px`,
        })
        const boxStyle = getBoxStyle(item.bbox)
        const refinedBoxStyle = item.refinedBbox
          ? getBoxStyle(item.refinedBbox)
          : null

        return (
          <div key={item.id}>
            <div
              className="absolute rounded-md border border-dashed border-cyan-300/70 bg-cyan-300/5"
              style={boxStyle}
            >
              <div className="absolute inset-0">
                <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-200" />
                <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-200" />
                <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-200" />
                <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-200" />
              </div>
              <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-cyan-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
                {item.className} · {formatConfidence(item.confidence)}
              </span>
            </div>

            {refinedBoxStyle && (
              <div
                className="absolute rounded-md border-2 border-solid border-emerald-300"
                style={refinedBoxStyle}
                aria-label={`Experimental ROI estimate for ${item.className}; confidence ${formatConfidence(item.refinementConfidence ?? 0)}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
