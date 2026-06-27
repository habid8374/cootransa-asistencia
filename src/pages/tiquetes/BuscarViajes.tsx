import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase, type Viaje } from '../../lib/supabase'
import { MapPin, Clock, Users, ArrowLeft, Bus } from 'lucide-react'

export default function BuscarViajes() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const origen = params.get('origen') ?? ''
  const destino = params.get('destino') ?? ''
  const fecha = params.get('fecha') ?? ''

  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!origen || !destino || !fecha) return
    const cargar = async () => {
      setCargando(true)
      const { data } = await supabase
        .from('viajes')
        .select('*, ruta:rutas!inner(origen, destino, duracion_min), bus:buses(nombre, placa, capacidad)')
        .eq('ruta.origen', origen)
        .eq('ruta.destino', destino)
        .eq('fecha', fecha)
        .eq('estado', 'programado')
        .gt('capacidad_disponible', 0)
        .order('hora_salida')
      setViajes((data as Viaje[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [origen, destino, fecha])

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const fmtDur = (min?: number) => {
    if (!min) return ''
    const h = Math.floor(min / 60), m = min % 60
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-600 px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <Link to="/tiquetes" className="flex items-center gap-1.5 text-brand-200 text-sm mb-4 hover:text-white transition">
            <ArrowLeft size={15} /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full p-1.5"><MapPin size={14} className="text-white" /></div>
            <div>
              <p className="text-white font-bold">{origen} → {destino}</p>
              <p className="text-brand-200 text-xs capitalize">{fmtFecha(fecha)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        {cargando ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">Buscando disponibilidad...</p>
          </div>
        ) : viajes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <Bus size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Sin disponibilidad</p>
            <p className="text-xs text-gray-400 mt-1">No hay viajes para esta ruta y fecha.</p>
            <Link to="/tiquetes" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
              Intentar otra fecha
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-2">
              {viajes.length} viaje{viajes.length !== 1 ? 's' : ''} disponible{viajes.length !== 1 ? 's' : ''}
            </p>
            {viajes.map(v => (
              <button
                key={v.id}
                onClick={() => navigate(`/tiquetes/checkout?viaje_id=${v.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-brand-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{v.hora_salida.slice(0, 5)}</p>
                    {v.ruta?.duracion_min && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {fmtDur(v.ruta.duracion_min)} de viaje
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-600">${v.precio.toLocaleString('es-CO')}</p>
                    <p className="text-xs text-gray-400">por persona</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  {v.bus && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Bus size={11} /> {v.bus.nombre || v.bus.placa}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
                    <Users size={11} />
                    <span className={v.capacidad_disponible <= 5 ? 'text-orange-500 font-semibold' : ''}>
                      {v.capacidad_disponible} disponibles
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
