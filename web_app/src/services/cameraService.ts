import type { CameraDevice, CameraStatus } from '../types'

export async function getCameraDevices(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []

  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices
    .filter((device) => device.kind === 'videoinput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || 'Rear camera',
      kind: 'videoinput',
    }))
}

export async function requestCameraAccess(
  preferredFacingMode: 'user' | 'environment' = 'environment',
) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support camera access.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: preferredFacingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })

  return stream
}

export async function switchCameraStream(currentStream: MediaStream, deviceId: string) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support camera switching.')
  }

  const nextStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } },
    audio: false,
  })

  currentStream.getTracks().forEach((track) => track.stop())
  return nextStream
}

export function stopCameraStream(stream?: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function getCameraStatusMessage(status: CameraStatus['state']) {
  switch (status) {
    case 'idle':
      return 'Camera ready'
    case 'requesting':
      return 'Requesting camera permission'
    case 'active':
      return 'Live camera active'
    case 'demo':
      return 'Demo mode active'
    case 'error':
      return 'Camera unavailable'
    default:
      return 'Camera status unknown'
  }
}
