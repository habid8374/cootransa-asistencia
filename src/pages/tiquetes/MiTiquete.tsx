import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase, type Tiquete } from '../../lib/supabase'
import { verificarTransaccion } from '../../lib/wompi'
import QRCode from 'qrcode'
import { CheckCircle2, Clock, MapPin, User, Calendar, ArrowLeft, AlertCircle, XCircle, Loader2 } from 'lucide-react'

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente de pago',  color: 'text-orange-600 bg-orange-50',  icon: <AlertCircle size={16} className="text-orange-500" /> },
  confirmado: { label: 'Confirmado ✓',        color: 'text-green-700 bg-green-50',    icon: <CheckCircle2 size={16} className="text-green-500" /> },
  usado:      { label: 'Tiquete usado',       color: 'text-gray-500 bg-gray-100',     icon: <CheckCircle2 size={16} className="text-gray-400" /> },
  cancelado:  { label: 'Cancelado',           color: 'text-red-600 bg-red-50',        icon: <XCircle size={16} className="text-red-500" /> },
}

export default function MiTiquete() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [tiquete, setTiquete] = useState<Tiquete | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const [verificando, setVerificando] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cargarTiquete = async () => {
    if (!id) return null
    const { data } = await supabase
      .from('tiquetes')
      .select('*, viaje:viajes(fecha, hora_salida, precio, ruta:rutas(origen, destino), bus:buses(nombre, placa)), pasajero:pasajeros(nombre, cedula, email, telefono)')
      .eq('id', id)
      .single()
    return data as Tiquete | null
  }

  useEffect(() => {
    if (!id) return

    const init = async () => {
      setCargando(true)

      // ¿Viene de Wompi? (tiene param "id" en URL = transaction ID de Wompi)
      const wompiTxId = searchParams.get('id')
      const wompiStatus = searchParams.get('status')

      let data = await cargarTiquete()

      // Si viene de Wompi y el tiquete sigue pendiente → verificar y confirmar
      if (wompiTxId && data?.estado === 'pendiente') {
        setVerificando(true)
        try {
          if (wompiStatus === 'APPROVED') {
            // Verificamos con la API de Wompi para mayor seguridad
            const tx = await verificarTransaccion(wompiTxId)
            if (tx?.status === 'APPROVED' && tx.reference === id) {
              await supabase.from('tiquetes').update({
                estado: 'confirmado',
                referencia_pago: wompiTxId,
              }).eq('id', id)
              data = await cargarTiquete()
            }
          }
        } catch {
          // Si falla la verificación, dejamos el tiquete en pendiente
        }
        setVerificando(false)
        // Limpiar los params de Wompi de la URL sin recargar la página
        window.history.replaceState({}, '', `/tiquetes/ver/${id}`)
      }

      setTiquete(data)

      if (data) {
        const url = await QRCode.toDataURL(`COOTRANSA-${data.id}`, {
          width: 280, margin: 2,
          color: { dark: '#166534', light: '#FFFFFF' },
        })
        setQrUrl(url)
      }
      setCargando(false)
    }

    init()
  }, [id])

  if (cargando) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      {verificando && <p className="text-sm text-gray-500">Verificando pago con Wompi...</p>}
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
                  {tiquete.parada_origen ?? v?.ruta?.origen} → {tiquete.parada_destino ?? v?.ruta?.destino}
                </p>
                {tiquete.parada_origen && (
                  <p className="text-brand-300 text-[10px] mt-0.5">
                    Línea {v?.ruta?.origen} → {v?.ruta?.destino}
                  </p>
                )}
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
                <p className="text-xs font-semibold text-gray-800">{v?.hora_salida?.slice(0, 5) ?? '–'}</p>
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
                <p className="text-[10px] text-gray-400 capitalize">{tiquete.metodo_pago ?? '–'}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="px-5 py-5 flex flex-col items-center">
            {verificando ? (
              <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-blue-50 rounded-2xl gap-2">
                <Loader2 size={32} className="text-blue-300 animate-spin" />
                <p className="text-xs text-blue-400">Verificando pago...</p>
              </div>
            ) : tiquete.estado === 'cancelado' ? (
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

        {/* Avisos según estado */}
        {tiquete.estado === 'pendiente' && tiquete.metodo_pago === 'taquilla' && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">Reserva activa</p>
            <p className="text-xs text-orange-600 mt-1">Paga en taquilla al abordar el bus.</p>
          </div>
        )}
        {tiquete.estado === 'pendiente' && tiquete.metodo_pago === 'tarjeta' && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-blue-800">Pago no completado</p>
            <p className="text-xs text-blue-600 mt-1">El pago con tarjeta no se completó. Intenta de nuevo o elige otro método.</p>
          </div>
        )}
        {tiquete.estado === 'confirmado' && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <p className="text-xs text-green-700 font-medium">Pago confirmado. Presenta el QR al conductor.</p>
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
