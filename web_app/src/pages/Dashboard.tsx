import { Activity, Camera, Mic, ShieldAlert, TriangleAlert } from 'lucide-react'
import { CameraView } from '../components/CameraView'
import { HazardPanel } from '../components/HazardPanel'
import { NavigationPanel } from '../components/NavigationPanel'
import { ObjectList } from '../components/ObjectList'
import { StatusIndicator } from '../components/StatusIndicator'
import { VoiceControls } from '../components/VoiceControls'
import type {
  DetectionObject,
  PathAssessment,
  PipelineMetrics,
  SurfaceAssessment,
} from '../types'
import { formatConfidence } from '../utils/helpers'

interface DashboardProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  detections: DetectionObject[]
  path: PathAssessment | null
  direction: string
  surface: SurfaceAssessment | null
  metrics: PipelineMetrics | null
  latestVoiceMessage: string
  status: string
  isLive: boolean
  isDemo: boolean
  voiceEnabled: boolean
  rate: number
  voiceName: string
  voices: Array<{ name: string; lang: string }>
  onStart: () => void
  onStop: () => void
  onToggleVoice: () => void
  onRateChange: (value: number) => void
  onVoiceChange: (value: string) => void
  onRepeat: () => void
  onDemoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function Dashboard({
  videoRef,
  detections,
  path,
  direction,
  surface,
  metrics,
  latestVoiceMessage,
  status,
  isLive,
  isDemo,
  voiceEnabled,
  rate,
  voiceName,
  voices,
  onStart,
  onStop,
  onToggleVoice,
  onRateChange,
  onVoiceChange,
  onRepeat,
  onDemoUpload,
}: DashboardProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatusIndicator label="Camera" value={status} tone={status.toLowerCase().includes('error') ? 'red' : 'blue'} />
        <StatusIndicator label="Detection" value={detections.length ? `${detections.length} objects` : 'Scanning'} tone={detections.length ? 'green' : 'amber'} />
        <StatusIndicator label="Priority" value={detections[0]?.priority ?? 'Low'} tone="amber" />
        <StatusIndicator
          label="Processing FPS"
          value={metrics ? metrics.processingFps.toFixed(1) : '—'}
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <CameraView
            videoRef={videoRef}
            detections={detections}
            path={path}
            status={status}
            isLive={isLive}
            isDemo={isDemo}
            onStart={onStart}
            onStop={onStop}
            onDemoUpload={onDemoUpload}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-100">
              <Activity className="h-4 w-4 text-cyan-400" />
              Live summary
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
                  Latest direction
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-100">{direction}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <Camera className="h-3.5 w-3.5 text-cyan-400" />
                  Detected object count
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-100">{detections.length}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <Mic className="h-3.5 w-3.5 text-cyan-400" />
                  Latest voice message
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {latestVoiceMessage || 'No alert has been spoken yet.'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <TriangleAlert className="h-3.5 w-3.5 text-amber-400" />
                  Heuristic surface check
                </div>
                <div className="mt-2 text-sm font-medium text-slate-100">
                  {surface?.message ?? 'Waiting for a camera frame.'}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Risk: {surface?.risk ?? 'Waiting for a frame'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Pipeline metrics
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <dt className="text-slate-400">Model load (first run)</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.modelLoadMs.toFixed(0)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">Inference avg (20 frames)</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.inferenceMs.toFixed(0)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">ROI refinement avg/frame</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.refinementMs.toFixed(1)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">Detection confidence avg</dt>
                  <dd className="text-right text-slate-200">
                    {metrics?.averageConfidence !== null && metrics?.averageConfidence !== undefined
                      ? `${(metrics.averageConfidence * 100).toFixed(0)}%`
                      : '—'}
                  </dd>
                  <dt className="text-slate-400">Surface analysis</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.surfaceAnalysisMs.toFixed(1)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">Post-processing</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.postProcessingMs.toFixed(1)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">End-to-end cycle</dt>
                  <dd className="text-right text-slate-200">
                    {metrics ? `${metrics.totalMs.toFixed(0)} ms` : '—'}
                  </dd>
                  <dt className="text-slate-400">TF.js backend</dt>
                  <dd className="text-right text-slate-200">{metrics?.backend ?? '—'}</dd>
                  <dt className="text-slate-400">TF tensor memory</dt>
                  <dd className="text-right text-slate-200">
                    {metrics?.tensorMemoryBytes === null || !metrics
                      ? 'Unavailable'
                      : `${(metrics.tensorMemoryBytes / (1024 * 1024)).toFixed(1)} MB`}
                  </dd>
                </dl>
                <p className="mt-3 text-[10px] leading-4 text-slate-500">
                  Inference, refinement, surface, post-processing, cycle, and FPS
                  values average the latest 20 frames. Confidence averages
                  detections in those frames. Load time is first-run; tensor
                  memory excludes browser and GPU allocations.
                </p>
              </div>
            </div>
          </div>

          <VoiceControls
            enabled={voiceEnabled}
            rate={rate}
            voiceName={voiceName}
            voices={voices}
            onToggle={onToggleVoice}
            onRateChange={onRateChange}
            onVoiceChange={onVoiceChange}
            onRepeat={onRepeat}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ObjectList detections={detections} />
        <HazardPanel detections={detections} path={path} />
        <NavigationPanel path={path} direction={direction} />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-700 bg-slate-900/60 p-5">
        <div className="mb-4 text-sm font-medium text-slate-100">Detection metadata</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {detections.length ? (
            detections.map((detection) => (
              <div key={detection.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-100">{detection.className}</span>
                  <span className="text-cyan-200">{detection.priority}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">Confidence: {formatConfidence(detection.confidence)}</div>
                <div className="mt-1 text-xs text-slate-400">Position: {detection.position}</div>
                <div className="mt-1 text-xs text-slate-400">Corridor: {detection.centralCorridor ? 'Yes' : 'No'}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-300">
              No obstacle data yet. The assistant is waiting for a stable frame.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
