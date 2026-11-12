import { useCallback, useEffect, useState } from 'react'
import { getCameraDevices, getCameraStatusMessage, requestCameraAccess, stopCameraStream, switchCameraStream } from '../services/cameraService'
import type { CameraDevice, CameraStatus } from '../types'

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>({
    state: 'idle',
    message: 'Camera ready',
  })

  useEffect(() => {
    let cancelled = false

    getCameraDevices()
      .then((availableDevices) => {
        if (cancelled) return

        setDevices(availableDevices)
        setSelectedDeviceId((current) => current || availableDevices[0]?.deviceId || '')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Unable to list camera devices.'
        setStatus({ state: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => () => stopCameraStream(stream), [stream])

  const startCamera = useCallback(async () => {
    try {
      setStatus({ state: 'requesting', message: getCameraStatusMessage('requesting') })
      const cameraStream = await requestCameraAccess('environment')
      setStream(cameraStream)

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream
        videoRef.current.play().catch(() => undefined)
      }

      setStatus({ state: 'active', message: getCameraStatusMessage('active') })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to access camera.'
      setStatus({ state: 'error', message })
    }
  }, [videoRef])

  const stopCamera = useCallback(() => {
    stopCameraStream(stream)
    setStream(null)
    setStatus({ state: 'idle', message: getCameraStatusMessage('idle') })

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream, videoRef])

  const switchCamera = useCallback(async (deviceId: string) => {
    if (!stream) return

    try {
      const nextStream = await switchCameraStream(stream, deviceId)
      setStream(nextStream)
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream
      }
      setSelectedDeviceId(deviceId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Camera switch failed.'
      setStatus({ state: 'error', message })
    }
  }, [stream, videoRef])

  return {
    devices,
    selectedDeviceId,
    stream,
    status,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
