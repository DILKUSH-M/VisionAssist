import { useEffect, useRef, useState } from 'react'
import { Camera, Info, Menu, ShieldCheck } from 'lucide-react'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { About } from './pages/About'
import { useCamera } from './hooks/useCamera'
import { useDetection } from './hooks/useDetection'
import { useSpeech } from './hooks/useSpeech'
import type { ViewMode } from './types'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [demoMode, setDemoMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const demoVideoUrlRef = useRef<string | null>(null)

  const { status: cameraStatus, startCamera, stopCamera } = useCamera(videoRef)
  const detectionState = useDetection(
    videoRef,
    cameraStatus.state === 'active' || cameraStatus.state === 'requesting' || demoMode,
    0.4,
  )
  const speech = useSpeech()
  const { speak } = speech
  const alertMessage = detectionState.alert?.message
  const alertPriority = detectionState.alert?.priority

  useEffect(() => {
    if (alertMessage && alertPriority) {
      speak(alertMessage, alertPriority)
    }
  }, [alertMessage, alertPriority, speak])

  useEffect(
    () => () => {
      if (demoVideoUrlRef.current) {
        URL.revokeObjectURL(demoVideoUrlRef.current)
      }
    },
    [],
  )

  const handleOpenDashboard = () => {
    setViewMode('dashboard')
    if (cameraStatus.state !== 'active') {
      startCamera().catch(() => undefined)
    }
  }

  const handleStop = () => {
    stopCamera()
    setDemoMode(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
    if (demoVideoUrlRef.current) {
      URL.revokeObjectURL(demoVideoUrlRef.current)
      demoVideoUrlRef.current = null
    }
  }

  const handleDemoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    stopCamera()
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
    if (demoVideoUrlRef.current) {
      URL.revokeObjectURL(demoVideoUrlRef.current)
    }

    const demoUrl = URL.createObjectURL(file)
    demoVideoUrlRef.current = demoUrl
    if (videoRef.current) {
      videoRef.current.src = demoUrl
      videoRef.current.muted = true
      videoRef.current.loop = true
      videoRef.current.play().catch(() => undefined)
    }

    setDemoMode(true)
    setViewMode('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setViewMode('home')}
            className="inline-flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-cyan-400/40">
              <Camera className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-wide text-slate-50">VisionAssist</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                See Your Surroundings Through AI
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-3 md:flex">
            {[
              { label: 'Home', value: 'home' },
              { label: 'Dashboard', value: 'dashboard' },
              { label: 'About', value: 'about' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setViewMode(item.value as ViewMode)}
                className={
                  viewMode === item.value
                    ? 'rounded-full bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 ring-1 ring-cyan-400/40'
                    : 'rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/80'
                }
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-100"
              onClick={() => setViewMode('dashboard')}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {viewMode === 'home' && <Home onOpenDashboard={handleOpenDashboard} />}
        {viewMode === 'dashboard' && (
          <Dashboard
            videoRef={videoRef}
            detections={detectionState.detections}
            path={detectionState.path}
            direction={detectionState.direction}
            surface={detectionState.surface}
            metrics={detectionState.metrics}
            latestVoiceMessage={speech.lastMessage}
            status={cameraStatus.state === 'active' ? 'Live camera active' : demoMode ? 'Demo mode active' : cameraStatus.message}
            isLive={cameraStatus.state === 'active' || demoMode}
            isDemo={demoMode}
            voiceEnabled={speech.enabled}
            rate={speech.rate}
            voiceName={speech.voiceName}
            voices={speech.voices}
            onStart={() => {
              if (demoMode) {
                if (videoRef.current) {
                  videoRef.current.play().catch(() => undefined)
                }
                return
              }
              startCamera().catch(() => undefined)
            }}
            onStop={handleStop}
            onToggleVoice={() => (speech.enabled ? speech.mute() : speech.unmute())}
            onRateChange={speech.setRate}
            onVoiceChange={speech.setVoiceName}
            onRepeat={speech.repeatLatest}
            onDemoUpload={handleDemoUpload}
          />
        )}
        {viewMode === 'about' && <About />}
      </main>

      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-3 border-t border-slate-800 px-4 py-6 text-xs uppercase tracking-[0.2em] text-slate-400 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Privacy-first AI demo
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Info className="h-4 w-4" />
          Experimental navigation assistant
        </div>
      </footer>
    </div>
  )
}

export default App
