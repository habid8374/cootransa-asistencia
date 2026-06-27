import { useEffect, useRef, useState } from 'react'
import { supabase, type Tiquete } from '../../lib/supabase'
import jsQR from 'jsqr'
import { Camera, CheckCircle2, XCircle, RotateCcw, QrCode } from 'lucide-react'

type Estado = 'scanning' | 'loading' | 'valido' | 'ya_usado' | 'cancelado' | 'no_encontrado' | 'error'

export default function ValidarQR() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [estado, setEstado] = useState<Estado>('scanning')
  const [tiquete, setTiquete] = useState<Tiquete | null>(null)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    iniciarCamara()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        videoRef.current.onloadedmetadata = () => escanear()
      }
    } catch {
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }

  const escanear = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(escanear)
      return
    }
    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code?.data?.startsWith('COOTRANSA-')) {
      const tiqueteId = code.data.replace('COOTRANSA-', '')
      validar(tiqueteId)
    } else {
      animRef.current = requestAnimationFrame(escanear)
    }
  }

  const validar = async (tiqueteId: string) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setEstado('loading')
    const { data, error } = await supabase
      .from('tiquetes')
      .select('*, viaje:viajes(fecha, hora_salida, ruta:rutas(origen, destino)), pasajero:pasajeros(nombre, cedula)')
      .eq('id', tiqueteId)
      .single()

    if (error || !data) { setEstado('no_encontrado'); return }
    const t = data as Tiquete
    setTiquete(t)
    if (t.estado === 'usado') { setEstado('ya_usado'); return }
    if (t.estado === 'cancelado') { setEstado('cancelado'); return }
    if (t.estado === 'pendiente' || t.estado === 'confirmado') {
      await supabase.from('tiquetes').update({ estado: 'usado', usado_at: new Date().toISOString() }).eq('id', tiqueteId)
      setEstado('valido')
    } else {
      setEstado('error')
    }
  }

  const reiniciar = () => {
    setEstado('scanning')
    setTiquete(null)
    escanear()
  }

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-white/10">
        <QrCode size={20} className="text-brand-400" />
        <div>
          <p className="font-bold text-sm">COOTRANSA · Conductor</p>
          <p className="text-xs text-gray-400">Validación de tiquetes</p>
        </div>
      </div>

      {/* Camera + Result */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {cameraError ? (
          <div className="text-center space-y-3">
            <Camera size={40} className="text-gray-600 mx-auto" />
            <p className="text-sm text-red-400">{cameraError}</p>
          </div>
        ) : estado === 'scanning' || estado === 'loading' ? (
          <div className="w-full max-w-sm space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Scan frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-400 rounded-br-lg" />
                  {estado === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400">
              {estado === 'loading' ? 'Verificando...' : 'Apunta la cámara al QR del tiquete'}
            </p>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          // Resultado
          <div className="w-full max-w-sm space-y-4">
            {estado === 'valido' && (
              <>
                <div className="bg-green-500/20 border border-green-500/30 rounded-3xl p-6 text-center space-y-3">
                  <CheckCircle2 size={56} className="text-green-400 mx-auto" />
                  <p className="text-2xl font-bold text-green-300">✓ Válido</p>
                  <p className="text-sm text-green-200">Pasajero autorizado para abordar</p>
                </div>
                {tiquete && (
                  <div className="bg-white/10 rounded-2xl p-4 space-y-2">
                    <p className="font-semibold">{tiquete.pasajero?.nombre}</p>
                    <p className="text-sm text-gray-300">C.C. {tiquete.pasajero?.cedula}</p>
                    <p className="text-sm text-gray-300">
                      {tiquete.viaje?.ruta?.origen} → {tiquete.viaje?.ruta?.destino}
                    </p>
                    <p className="text-sm text-gray-300">
                      {tiquete.viaje?.fecha ? fmtFecha(tiquete.viaje.fecha) : ''} · {tiquete.viaje?.hora_salida?.slice(0,5)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">Pago: {tiquete.metodo_pago ?? 'Por cobrar en taquilla'}</p>
                  </div>
                )}
              </>
            )}
            {estado === 'ya_usado' && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-3xl p-6 text-center space-y-3">
                <XCircle size={56} className="text-yellow-400 mx-auto" />
                <p className="text-xl font-bold text-yellow-300">Tiquete ya usado</p>
                <p className="text-sm text-yellow-200">Este tiquete ya fue validado anteriormente</p>
                {tiquete?.pasajero && <p className="text-sm text-yellow-100">{tiquete.pasajero.nombre}</p>}
              </div>
            )}
            {(estado === 'cancelado' || estado === 'no_encontrado' || estado === 'error') && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-3xl p-6 text-center space-y-3">
                <XCircle size={56} className="text-red-400 mx-auto" />
                <p className="text-xl font-bold text-red-300">
                  {estado === 'cancelado' ? 'Tiquete cancelado' : 'Tiquete inválido'}
                </p>
                <p className="text-sm text-red-200">
                  {estado === 'cancelado' ? 'Este tiquete fue cancelado y no es válido.' : 'No se encontró este tiquete en el sistema.'}
                </p>
              </div>
            )}
            <button
              onClick={reiniciar}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw size={16} /> Escanear otro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
