import { ArrowRight, Eye, ShieldCheck } from 'lucide-react'

interface HomeProps {
  onOpenDashboard: () => void
}

export function Home({ onOpenDashboard }: HomeProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/20 sm:p-8 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <Eye className="h-3.5 w-3.5" />
              VisionAssist
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              See Your Surroundings Through AI.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              VisionAssist brings real-time visual guidance to pedestrians with a smartphone camera,
              object detection, and spoken feedback that helps interpret obstacles, hazards, and the
              clearest route ahead.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Start Assistance
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Privacy-first demo
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-950/70 p-5">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>System Status</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2">
                  <span>Camera access</span>
                  <span className="font-semibold text-cyan-300">Requested</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2">
                  <span>Object detection</span>
                  <span className="font-semibold text-cyan-300">Active</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2">
                  <span>Voice output</span>
                  <span className="font-semibold text-cyan-300">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
