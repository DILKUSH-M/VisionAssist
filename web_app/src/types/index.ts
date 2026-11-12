export type DetectionPosition = 'Left' | 'Center' | 'Right'
export type HazardPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type SurfaceRisk = 'Unavailable' | 'Clear' | 'Low' | 'Medium' | 'High'
export type AlertPriority = 'info' | 'warning' | 'urgent'
export type ViewMode = 'home' | 'dashboard' | 'about'
export type CameraMode = 'live' | 'demo'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectionObject {
  id: string
  className: string
  confidence: number
  bbox: BoundingBox
  refinedBbox?: BoundingBox
  refinementConfidence?: number
  position: DetectionPosition
  centralCorridor: boolean
  priority: HazardPriority
  persistenceFrames: number
}

export interface PipelineMetrics {
  modelLoadMs: number
  inferenceMs: number
  refinementMs: number
  surfaceAnalysisMs: number
  postProcessingMs: number
  totalMs: number
  processingFps: number
  averageConfidence: number | null
  backend: string
  tensorMemoryBytes: number | null
}

export interface AssistAlert {
  message: string
  priority: AlertPriority
}

export interface SurfaceAssessment {
  risk: SurfaceRisk
  score: number
  message: string
  anomalyScore: number
  contrastScore: number
}

export interface PathAssessment {
  leftBlocked: boolean
  centerBlocked: boolean
  rightBlocked: boolean
  suggestedDirection: string
  summary: string
  surface: SurfaceAssessment
}

export interface SpeechSettings {
  enabled: boolean
  rate: number
  voiceName?: string
}

export interface CameraDevice {
  deviceId: string
  label: string
  kind: 'videoinput' | 'audioinput' | 'audiooutput'
}

export interface CameraStatus {
  state: 'idle' | 'requesting' | 'active' | 'error' | 'demo'
  message: string
}

export interface DetectionEvent {
  timestamp: number
  description: string
}
