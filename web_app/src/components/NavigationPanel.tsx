import { Compass, Navigation } from 'lucide-react'
import type { PathAssessment } from '../types'

interface NavigationPanelProps {
  path: PathAssessment | null
  direction: string
}

export function NavigationPanel({ path, direction }: NavigationPanelProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
        <Navigation className="h-4 w-4 text-cyan-400" />
        Navigation assistance
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
          <Compass className="h-3.5 w-3.5 text-cyan-400" />
          Suggested direction
        </div>
        <div className="text-xl font-semibold text-slate-50">{direction}</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Left</div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{path ? path.leftBlocked ? 'Obstructed' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Center</div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{path ? path.centerBlocked ? 'Obstructed' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Right</div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{path ? path.rightBlocked ? 'Obstructed' : 'No obstacle detected' : 'Scanning'}</div>
        </div>
      </div>
    </div>
  )
}
