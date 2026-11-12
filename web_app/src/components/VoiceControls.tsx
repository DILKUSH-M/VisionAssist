import { Volume2, VolumeX } from 'lucide-react'

interface VoiceControlsProps {
  enabled: boolean
  rate: number
  voiceName: string
  voices: Array<{ name: string; lang: string }>
  onToggle: () => void
  onRateChange: (value: number) => void
  onVoiceChange: (value: string) => void
  onRepeat: () => void
}

export function VoiceControls({
  enabled,
  rate,
  voiceName,
  voices,
  onToggle,
  onRateChange,
  onVoiceChange,
  onRepeat,
}: VoiceControlsProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm font-medium text-slate-100">
        <div className="flex items-center gap-2">
          {enabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          Voice assistance
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100"
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Speech rate</span>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={rate}
            onChange={(event) => onRateChange(Number(event.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="mt-1 text-right text-xs text-slate-300">{rate.toFixed(1)}x</div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Voice</span>
          <select
            value={voiceName}
            onChange={(event) => onVoiceChange(event.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
          >
            <option value="">System default</option>
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onRepeat}
          className="w-full rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
        >
          Repeat latest message
        </button>
      </div>
    </div>
  )
}
