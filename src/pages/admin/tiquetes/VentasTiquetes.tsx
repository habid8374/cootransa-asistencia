import { useEffect, useState } from 'react'
import { supabase, type Tiquete } from '../../../lib/supabase'
import { Ticket, TrendingUp, Users, CheckCircle2 } from 'lucide-react'

const ESTADO_COLORS: Record<string, string> = {
  pendiente:   'text-orange-700 bg-orange-50',
  confirmado:  'text-blue-700 bg-blue-50',
  usado:       'text-gray-500 bg-gray-100',
  cancelado:   'text-red-600 bg-red-50',
}
const METODO_ICONS: Record<string, string> = {
  nequi:     '💜',
  daviplata: '🔴',
  pse:       '🏦',
  tarjeta:   '💳',
  taquilla:  '🏷️',
}

export default function VentasTiquetes() {
  const [tiquetes, setTiquetes] = useState<Tiquete[]>([])
  const [desde, setDesde] = useState(new Date().toISOString().slice(0, 10))
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0, 10))
  const [cargando, setCargando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('tiquetes')
      .select('*, viaje:viajes(fecha, hora_salida, ruta:rutas(origen, destino)), pasajero:pasajeros(nombre, cedula)')
      .gte('created_at', desde + 'T00:00:00')
      .lte('created_at', hasta + 'T23:59:59')
      .order('created_at', { ascending: false })
    setTiquetes((data as Tiquete[]) ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const total = tiquetes.length
  const recaudado = tiquetes.filter(t => t.estado !== 'cancelado').reduce((s, t) => s + t.precio, 0)
  const usados = tiquetes.filter(t => t.estado === 'usado').length
  const pendientes = tiquetes.filter(t => t.estado === 'pendiente').length

  const cancelar = async (id: string) => {
    await supabase.from('tiquetes').update({ estado: 'cancelado' }).eq('id', id)
    cargar()
  }

  const confirmar = async (id: string) => {
    await supabase.from('tiquetes').update({ estado: 'confirmado' }).eq('id', id)
    cargar()
  }

  const reactivar = async (id: string) => {
    await supabase.from('tiquetes').update({ estado: 'confirmado' }).eq('id', id)
    cargar()
  }

  const eliminar = async (t: Tiquete) => {
    await supabase.from('tiquetes').delete().eq('id', t.id)
    // Devolver el cupo al viaje
    if (t.viaje_id) {
      const { data: v } = await supabase.from('viajes').select('capacidad_disponible').eq('id', t.viaje_id).single()
      if (v) await supabase.from('viajes').update({ capacidad_disponible: v.capacidad_disponible + 1 }).eq('id', t.viaje_id)
    }
    cargar()
  }

  const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-400">Desde</span>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="text-sm outline-none" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-400">Hasta</span>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="text-sm outline-none" />
        </div>
        <button onClick={cargar} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition">
          Buscar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total tiquetes', value: total, icon: <Ticket size={16} />, color: 'text-brand-600 bg-brand-50' },
          { label: 'Recaudado', value: `$${recaudado.toLocaleString('es-CO')}`, icon: <TrendingUp size={16} />, color: 'text-green-600 bg-green-50' },
          { label: 'Usados / Abordaron', value: usados, icon: <CheckCircle2 size={16} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pendientes pago', value: pendientes, icon: <Users size={16} />, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {cargando ? (
          <p className="text-center text-sm text-gray-400 py-10">Cargando...</p>
        ) : tiquetes.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Sin ventas en este rango de fechas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Pasajero', 'Ruta', 'Viaje', 'Precio', 'Pago', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tiquetes.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{t.pasajero?.nombre}</p>
                      <p className="text-gray-400 text-[11px]">{t.pasajero?.cedula}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {t.viaje?.ruta?.origen} → {t.viaje?.ruta?.destino}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.viaje?.fecha ? fmtFecha(t.viaje.fecha + 'T12:00:00') : '–'} {t.viaje?.hora_salida?.slice(0,5)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                      ${t.precio.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.metodo_pago ? `${METODO_ICONS[t.metodo_pago] ?? ''} ${t.metodo_pago}` : '–'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[t.estado]}`}>
                        {t.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {t.estado === 'pendiente' && (
                          <button onClick={() => confirmar(t.id)} className="text-[10px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition">
                            Confirmar
                          </button>
                        )}
                        {t.estado === 'cancelado' && (
                          <>
                            <button onClick={() => reactivar(t.id)} className="text-[10px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition">
                              Reactivar
                            </button>
                            <button onClick={() => eliminar(t)} className="text-[10px] font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                              Eliminar
                            </button>
                          </>
                        )}
                        {t.estado !== 'cancelado' && t.estado !== 'usado' && (
                          <button onClick={() => cancelar(t.id)} className="text-[10px] font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                            Cancelar
                          </button>
                        )}
                        <a href={`/tiquetes/ver/${t.id}`} target="_blank" className="text-[10px] font-semibold text-gray-400 hover:bg-gray-100 px-2 py-1 rounded-lg transition">
                          Ver QR
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
