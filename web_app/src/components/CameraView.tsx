import { Camera, CameraOff, Play, Square, Video } from 'lucide-react'
import type { DetectionObject, PathAssessment } from '../types'
import { DetectionOverlay } from './DetectionOverlay'

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  detections: DetectionObject[]
  path: PathAssessment | null
  status: string
  isLive: boolean
  isDemo: boolean
  onStart: () => void
  onStop: () => void
  onDemoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function CameraView({
  videoRef,
  detections,
  path,
  status,
  isLive,
  isDemo,
  onStart,
  onStop,
  onDemoUpload,
}: CameraViewProps) {
  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-slate-950/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Video className="h-4 w-4 text-cyan-400" />
          Live camera feed
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {status}
        </div>
      </div>

      <div className="relative aspect-[9/16] max-h-[72vh] overflow-hidden rounded-[1.5rem] bg-slate-900">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {!isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-center text-slate-100">
            <div>
              <CameraOff className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-lg font-semibold">Camera paused</p>
              <p className="mt-1 text-sm text-slate-300">Start assistance to begin live detection.</p>
            </div>
          </div>
        )}

        {isLive && (
          <DetectionOverlay
            detections={detections}
            path={path}
            videoRef={videoRef}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
        >
          <Play className="h-4 w-4" />
          {isLive ? 'Resume' : 'Start Assistance'}
        </button>

        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700"
        >
          <Square className="h-4 w-4" />
          Stop
        </button>

        {isDemo && onDemoUpload && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-500/60 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20">
            <Camera className="h-4 w-4" />
            Load demo video
            <input type="file" accept="video/*" className="hidden" onChange={onDemoUpload} />
          </label>
        )}
      </div>
    </div>
  )
}
