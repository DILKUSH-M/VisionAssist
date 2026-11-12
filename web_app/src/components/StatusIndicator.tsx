interface StatusIndicatorProps {
  label: string
  value: string
  tone?: 'blue' | 'green' | 'amber' | 'red'
}

const toneClasses: Record<NonNullable<StatusIndicatorProps['tone']>, string> = {
  blue: 'bg-sky-500/15 text-sky-200 ring-sky-400/40',
  green: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
  amber: 'bg-amber-500/15 text-amber-100 ring-amber-400/40',
  red: 'bg-rose-500/15 text-rose-100 ring-rose-400/40',
}

export function StatusIndicator({ label, value, tone = 'blue' }: StatusIndicatorProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 shadow-lg shadow-slate-950/10">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  )
}
