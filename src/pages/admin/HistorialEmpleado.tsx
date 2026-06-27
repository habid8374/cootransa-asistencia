import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion, type Permiso } from '../../lib/supabase'
import { X, LogIn, LogOut, AlertTriangle, ShieldCheck, Zap, Clock } from 'lucide-react'

function minsLate(ts: string, horaEsp: string): number {
  const [hh, mm] = horaEsp.split(':').map(Number)
  const esp = new Date(ts); esp.setHours(hh, mm, 0, 0)
  return Math.max(0, Math.floor((new Date(ts).getTime() - esp.getTime()) / 60000))
}
function minsEarly(ts: string, horaEsp: string): number {
  const [hh, mm] = horaEsp.split(':').map(Number)
  const esp = new Date(ts); esp.setHours(hh, mm, 0, 0)
  return Math.max(0, Math.floor((esp.getTime() - new Date(ts).getTime()) / 60000))
}

interface Stats {
  diasTrabajados: number
  horasMs: number
  tardanzas: number
  minutosTardanza: number
  diasAnticipados: number
  minutosExtra: number
  diasPermiso: number
}

export default function HistorialEmpleado({ empleado, onClose }: { empleado: Empleado; onClose: () => void }) {
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [cargando, setCargando] = useState(true)

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59)
  const labelMes = ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from('marcaciones').select('*')
          .eq('empleado_id', empleado.id)
          .gte('timestamp', inicioMes.toISOString())
          .lte('timestamp', finMes.toISOString())
          .order('timestamp', { ascending: false }),
        supabase.from('permisos').select('*')
          .eq('empleado_id', empleado.id)
          .gte('fecha', inicioMes.toISOString().slice(0, 10))
          .lte('fecha', finMes.toISOString().slice(0, 10)),
      ])
      const marcas = (m ?? []) as Marcacion[]
      const perms = (p ?? []) as Permiso[]
      setMarcaciones(marcas)
      setPermisos(perms)

      const porDia = marcas.reduce<Record<string, Marcacion[]>>((acc, mk) => {
        const dia = new Date(mk.timestamp).toISOString().slice(0, 10)
        ;(acc[dia] ??= []).push(mk); return acc
      }, {})

      let horasMs = 0, tardanzas = 0, minutosTardanza = 0, diasAnticipados = 0, minutosExtra = 0
      for (const [dia, lista] of Object.entries(porDia)) {
        const tienePermiso = perms.some(p => p.fecha === dia)
        const ord = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        let entrada: number | null = null
        let tardanzaDia = false, anticipadoDia = false, extraDia = 0

        for (const mk of ord) {
          if (mk.tipo === 'entrada') {
            entrada = new Date(mk.timestamp).getTime()
            if (!tienePermiso && empleado.hora_entrada) {
              const mins = minsLate(mk.timestamp, empleado.hora_entrada)
              if (mins > 0) { tardanzaDia = true; minutosTardanza += mins }
            }
          } else if (mk.tipo === 'salida') {
            if (entrada != null) { horasMs += new Date(mk.timestamp).getTime() - entrada; entrada = null }
            if (!tienePermiso && empleado.hora_salida) {
              if (minsEarly(mk.timestamp, empleado.hora_salida) > 0) anticipadoDia = true
              const ex = minsLate(mk.timestamp, empleado.hora_salida)
              if (ex > 0) extraDia = Math.max(extraDia, ex)
            }
          }
        }
        if (tardanzaDia) tardanzas++
        if (anticipadoDia) diasAnticipados++
        minutosExtra += extraDia
      }

      setStats({
        diasTrabajados: Object.keys(porDia).length,
        horasMs, tardanzas, minutosTardanza, diasAnticipados, minutosExtra,
        diasPermiso: perms.length,
      })
      setCargando(false)
    }
    cargar()
  }, [empleado.id])

  const fmtHora = (ts: string) => new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  const fmtHoras = (ms: number) => {
    const h = Math.floor(ms / 3.6e6), m = Math.round((ms % 3.6e6) / 60000)
    return `${h}h ${m}m`
  }

  const porDia = marcaciones.reduce<Record<string, Marcacion[]>>((acc, m) => {
    const dia = new Date(m.timestamp).toISOString().slice(0, 10)
    ;(acc[dia] ??= []).push(m); return acc
  }, {})
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

  const tituloDia = (iso: string) => new Date(iso + 'T12:00:00')
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            {empleado.foto_url ? (
              <img src={empleado.foto_url} className="w-10 h-10 rounded-full object-cover border-2 border-brand-100 shrink-0" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {empleado.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-gray-900">{empleado.nombre}</h2>
              <p className="text-xs text-gray-400">{empleado.cedula}{empleado.cargo ? ` · ${empleado.cargo}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        {/* Month label */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider capitalize">{labelMes}</p>
        </div>

        {cargando ? (
          <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-400">Cargando...</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-brand-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-brand-700">{stats.diasTrabajados}</p>
                  <p className="text-[10px] text-brand-600 font-semibold mt-0.5">Días trab.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{stats.horasMs > 0 ? fmtHoras(stats.horasMs) : '—'}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Horas totales</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${stats.tardanzas > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-xl font-bold ${stats.tardanzas > 0 ? 'text-red-600' : 'text-gray-800'}`}>{stats.tardanzas}</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${stats.tardanzas > 0 ? 'text-red-500' : 'text-gray-500'}`}>Tardanzas</p>
                </div>
                {stats.minutosTardanza > 0 && (
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{stats.minutosTardanza}m</p>
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">Min. tarde</p>
                  </div>
                )}
                {stats.diasAnticipados > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-orange-600">{stats.diasAnticipados}</p>
                    <p className="text-[10px] text-orange-500 font-semibold mt-0.5">Sal. antic.</p>
                  </div>
                )}
                {stats.minutosExtra > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-purple-700">{stats.minutosExtra}m</p>
                    <p className="text-[10px] text-purple-600 font-semibold mt-0.5">H. Extra</p>
                  </div>
                )}
                {stats.diasPermiso > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-700">{stats.diasPermiso}</p>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Permisos</p>
                  </div>
                )}
              </div>
            )}

            {/* Schedule reference */}
            {(empleado.hora_entrada || empleado.hora_salida) && (
              <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
                <Clock size={13} className="shrink-0 text-gray-400" />
                <span>Horario esperado: <strong>{empleado.hora_entrada ?? '—'}</strong> – <strong>{empleado.hora_salida ?? '—'}</strong></span>
              </div>
            )}

            {/* Marcaciones by day */}
            {dias.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">Sin marcaciones este mes.</div>
            ) : (
              <div className="space-y-3">
                {dias.map(dia => {
                  const lista = [...porDia[dia]].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                  const permisoDia = permisos.find(p => p.fecha === dia)
                  return (
                    <div key={dia}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 capitalize">{tituloDia(dia)}</p>
                        {permisoDia && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ShieldCheck size={9} /> {permisoDia.nombre}
                          </span>
                        )}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex flex-wrap gap-1.5">
                        {lista.map(m => {
                          const tarde = empleado.hora_entrada && m.tipo === 'entrada' && !permisoDia
                            ? minsLate(m.timestamp, empleado.hora_entrada) : 0
                          const anticipado = empleado.hora_salida && m.tipo === 'salida' && !permisoDia
                            ? minsEarly(m.timestamp, empleado.hora_salida) : 0
                          const extra = empleado.hora_salida && m.tipo === 'salida' && !permisoDia
                            ? minsLate(m.timestamp, empleado.hora_salida) : 0
                          return (
                            <span key={m.id} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${
                              tarde > 0 ? 'bg-red-50 text-red-700'
                              : extra > 0 ? 'bg-purple-50 text-purple-700'
                              : anticipado > 0 ? 'bg-orange-50 text-orange-700'
                              : m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>
                              {m.tipo === 'entrada' ? <LogIn size={10} /> : <LogOut size={10} />}
                              {tarde > 0 && <AlertTriangle size={9} />}
                              {extra > 0 && <Zap size={9} />}
                              {fmtHora(m.timestamp)}
                              {tarde > 0 && <span>+{tarde}m</span>}
                              {anticipado > 0 && <span>-{anticipado}m</span>}
                              {extra > 0 && <span>+{extra}m</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Permisos list */}
            {permisos.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Permisos del mes</p>
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {permisos.map(p => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center gap-2">
                      <ShieldCheck size={13} className="text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{p.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long' })}
                          {p.hora_inicio && ` · ${p.hora_inicio}–${p.hora_fin}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
