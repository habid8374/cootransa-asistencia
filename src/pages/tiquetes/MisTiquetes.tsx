import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, type Tiquete } from '../../lib/supabase'
import { ArrowLeft, Ticket, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight } from 'lucide-react'

const ESTADO_ICON: Record<string, React.ReactNode> = {
  pendiente:  <AlertCircle size={14} className="text-orange-400" />,
  confirmado: <CheckCircle2 size={14} className="text-green-500" />,
  usado:      <CheckCircle2 size={14} className="text-gray-300" />,
  cancelado:  <XCircle size={14} className="text-red-400" />,
}
const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', usado: 'Usado', cancelado: 'Cancelado',
}

export default function MisTiquetes() {
  const [searchParams] = useSearchParams()
  const cedulaParam = searchParams.get('cedula') ?? ''

  const [cedula, setCedula] = useState(cedulaParam)
  const [tiquetes, setTiquetes] = useState<Tiquete[]>([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async (c?: string) => {
    const val = c ?? cedula
    if (!val.trim()) return
    setCargando(true); setBuscado(false)
    const { data: pasajero } = await supabase.from('pasajeros').select('id').eq('cedula', val.trim()).single()
    if (!pasajero) { setTiquetes([]); setCargando(false); setBuscado(true); return }
    const { data } = await supabase
      .from('tiquetes')
      .select('*, viaje:viajes(fecha, hora_salida, ruta:rutas(origen, destino))')
      .eq('pasajero_id', pasajero.id)
      .order('created_at', { ascending: false })
    setTiquetes((data as Tiquete[]) ?? [])
    setCargando(false); setBuscado(true)
  }

  useEffect(() => {
    if (cedulaParam) buscar(cedulaParam)
  }, [])

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-600 px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <Link to="/tiquetes" className="flex items-center gap-1.5 text-brand-200 text-sm mb-4 hover:text-white">
            <ArrowLeft size={15} /> Inicio
          </Link>
          <p className="text-white font-bold text-lg">Mis tiquetes</p>
          <p className="text-brand-200 text-xs mt-0.5">Consulta por número de cédula</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-8 space-y-4">
        {/* Búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex gap-2">
            <input
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              placeholder="Número de cédula"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              onKeyDown={e => e.key === 'Enter' && buscar()}
            />
            <button
              onClick={() => buscar()}
              disabled={cargando}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
            >
              {cargando ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {buscado && !cargando && (
          tiquetes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Ticket size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-semibold">Sin tiquetes</p>
              <p className="text-xs text-gray-400 mt-1">No encontramos compras para esa cédula.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 px-1">{tiquetes.length} tiquete{tiquetes.length !== 1 ? 's' : ''}</p>
              {tiquetes.map(t => (
                <Link
                  key={t.id}
                  to={`/tiquetes/ver/${t.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="bg-brand-50 rounded-xl p-2.5 shrink-0">
                    {ESTADO_ICON[t.estado]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {t.viaje?.ruta?.origen} → {t.viaje?.ruta?.destino}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize flex items-center gap-1">
                        {t.viaje?.fecha ? fmtFecha(t.viaje.fecha) : '–'}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {t.viaje?.hora_salida?.slice(0,5)}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{ESTADO_LABEL[t.estado]}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-600">${t.precio.toLocaleString('es-CO')}</p>
                    <ChevronRight size={14} className="text-gray-300 ml-auto mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
