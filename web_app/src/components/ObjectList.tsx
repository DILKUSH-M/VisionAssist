import { AlertTriangle, CircleDashed } from 'lucide-react'
import type { DetectionObject } from '../types'
import { formatConfidence } from '../utils/helpers'

interface ObjectListProps {
  detections: DetectionObject[]
}

export function ObjectList({ detections }: ObjectListProps) {
  if (!detections.length) {
    return (
      <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-300">
        <div className="mb-3 flex items-center gap-2 font-medium text-slate-100">
          <CircleDashed className="h-4 w-4 text-cyan-400" />
          Detection feed
        </div>
        No objects detected yet. Keep the camera aimed at your surroundings.
      </div>
    )
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
        <AlertTriangle className="h-4 w-4 text-cyan-400" />
        Detected objects
      </div>

      <div className="space-y-3">
        {detections.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-slate-100">{item.className}</div>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {item.priority}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
              <span>Confidence: {formatConfidence(item.confidence)}</span>
              <span>{item.position}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Corridor overlap: {item.centralCorridor ? 'Yes' : 'No'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Seen for {item.persistenceFrames} frame{item.persistenceFrames === 1 ? '' : 's'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
