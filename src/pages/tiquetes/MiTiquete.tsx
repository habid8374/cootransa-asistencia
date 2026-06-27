import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Tiquete } from '../../lib/supabase'
import QRCode from 'qrcode'
import { CheckCircle2, Clock, MapPin, User, Calendar, ArrowLeft, AlertCircle, XCircle } from 'lucide-react'

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente de pago', color: 'text-orange-600 bg-orange-50', icon: <AlertCircle size={16} className="text-orange-500" /> },
  confirmado: { label: 'Confirmado',         color: 'text-green-700 bg-green-50',   icon: <CheckCircle2 size={16} className="text-green-500" /> },
  usado:      { label: 'Tiquete usado',      color: 'text-gray-500 bg-gray-100',    icon: <CheckCircle2 size={16} className="text-gray-400" /> },
  cancelado:  { label: 'Cancelado',          color: 'text-red-600 bg-red-50',       icon: <XCircle size={16} className="text-red-500" /> },
}

export default function MiTiquete() {
  const { id } = useParams<{ id: string }>()
  const [tiquete, setTiquete] = useState<Tiquete | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      const { data } = await supabase
        .from('tiquetes')
        .select('*, viaje:viajes(fecha, hora_salida, precio, ruta:rutas(origen, destino), bus:buses(nombre, placa)), pasajero:pasajeros(nombre, cedula, email, telefono)')
        .eq('id', id)
        .single()
      setTiquete(data as Tiquete)
      if (data) {
        const url = await QRCode.toDataURL(`COOTRANSA-${data.id}`, {
          width: 280,
          margin: 2,
          color: { dark: '#166534', light: '#FFFFFF' },
        })
        setQrUrl(url)
      }
      setCargando(false)
    }
    cargar()
  }, [id])

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )
  if (!tiquete) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <XCircle size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Tiquete no encontrado</p>
        <Link to="/tiquetes" className="mt-3 inline-block text-sm text-brand-600 hover:underline">Volver al inicio</Link>
      </div>
    </div>
  )

  const est = ESTADO_CONFIG[tiquete.estado]
  const v = tiquete.viaje
  const p = tiquete.pasajero

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-sm">
        <Link to="/tiquetes/mis-tiquetes" className="flex items-center gap-1.5 text-gray-500 text-sm mb-4 hover:text-gray-700">
          <ArrowLeft size={14} /> Mis tiquetes
        </Link>

        {/* Tarjeta del tiquete */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-200 text-xs font-semibold">COOTRANSA</p>
                <p className="text-white font-bold text-lg mt-0.5">
                  {v?.ruta?.origen} → {v?.ruta?.destino}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${est.color}`}>
                {est.icon} {est.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-dashed border-gray-200">
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fecha</p>
                <p className="text-xs font-semibold text-gray-800 capitalize">
                  {v?.fecha ? fmtFecha(v.fecha) : '–'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Salida</p>
                <p className="text-xs font-semibold text-gray-800">{v?.hora_salida?.slice(0,5) ?? '–'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pasajero</p>
                <p className="text-xs font-semibold text-gray-800">{p?.nombre}</p>
                <p className="text-[10px] text-gray-400">C.C. {p?.cedula}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Precio</p>
                <p className="text-sm font-bold text-brand-600">${tiquete.precio.toLocaleString('es-CO')}</p>
                <p className="text-[10px] text-gray-400 capitalize">{tiquete.metodo_pago ?? 'Sin definir'}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="px-5 py-5 flex flex-col items-center">
            {tiquete.estado === 'cancelado' ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-red-50 rounded-2xl">
                <XCircle size={48} className="text-red-200" />
              </div>
            ) : tiquete.estado === 'usado' ? (
              <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl">
                <CheckCircle2 size={48} className="text-gray-200" />
                <p className="text-xs text-gray-400 mt-2">Tiquete utilizado</p>
              </div>
            ) : qrUrl ? (
              <>
                <img src={qrUrl} alt="QR tiquete" className="w-[200px] h-[200px] rounded-xl" />
                <p className="text-[10px] text-gray-400 mt-2 text-center">Muestra este código al conductor</p>
              </>
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-50 rounded-2xl animate-pulse" />
            )}
          </div>

          {/* ID corto */}
          <div className="px-5 pb-5 text-center">
            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-mono">
              {tiquete.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Aviso pendiente */}
        {tiquete.estado === 'pendiente' && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">Pago pendiente</p>
            <p className="text-xs text-orange-600 mt-1">
              Tu reserva está activa. Recuerda pagar en taquilla al abordar.
            </p>
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-5">
          Guarda esta página o toma una captura de pantalla
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
