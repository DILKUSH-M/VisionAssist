import { ShieldAlert, Zap } from 'lucide-react'
import type { DetectionObject, PathAssessment } from '../types'

interface HazardPanelProps {
  detections: DetectionObject[]
  path: PathAssessment | null
}

export function HazardPanel({ detections, path }: HazardPanelProps) {
  const highest = [...detections].sort((a, b) => {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    return rank[b.priority] - rank[a.priority]
  })[0]

  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
        <ShieldAlert className="h-4 w-4 text-cyan-400" />
        Hazard priority
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current status</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-2xl font-bold text-slate-50">{highest?.priority ?? 'Low'}</div>
          <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-200">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Left</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">{path ? path.leftBlocked ? 'Blocked' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Center</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">{path ? path.centerBlocked ? 'Blocked' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Right</div>
          <div className="mt-2 text-lg font-semibold text-slate-100">{path ? path.rightBlocked ? 'Blocked' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
      </div>
    </div>
  )
}
