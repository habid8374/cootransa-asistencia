import { useEffect, useState } from 'react'
import { supabase, type Marcacion, type Permiso } from '../../lib/supabase'
import Modal from '../../components/Modal'
import { Download, Trash2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'

interface ModalState {
  title: string; message: string; variant?: 'danger'; confirmLabel?: string; onConfirm: () => void
}

type MarcacionExt = Marcacion & { empleado?: { nombre?: string; cedula?: string; cargo?: string; hora_entrada?: string; hora_salida?: string } }

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

export default function Reportes() {
  const [marcaciones, setMarcaciones] = useState<MarcacionExt[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [modal, setModal] = useState<ModalState | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const [desde, setDesde] = useState(hace30)
  const [hasta, setHasta] = useState(hoy)

  const cargar = async () => {
    const desdeISO = new Date(desde + 'T00:00:00').toISOString()
    const hastaISO = new Date(hasta + 'T23:59:59').toISOString()
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('marcaciones')
        .select('*, empleado:empleados(nombre, cedula, cargo, hora_entrada, hora_salida)')
        .gte('timestamp', desdeISO).lte('timestamp', hastaISO)
        .order('timestamp', { ascending: false }).limit(500),
      supabase.from('permisos').select('*').gte('fecha', desde).lte('fecha', hasta),
    ])
    setMarcaciones((m as unknown as MarcacionExt[]) ?? [])
    setPermisos((p as Permiso[]) ?? [])
  }

  useEffect(() => { cargar() }, [desde, hasta])

  const getPermiso = (empleadoId: string, fecha: string) =>
    permisos.find(p => p.empleado_id === empleadoId && p.fecha === fecha)

  const tardanzaMins = (m: MarcacionExt): number => {
    if (m.tipo !== 'entrada' || !m.empleado?.hora_entrada) return 0
    const fecha = new Date(m.timestamp).toISOString().slice(0, 10)
    if (getPermiso(m.empleado_id, fecha)) return 0
    return minsLate(m.timestamp, m.empleado.hora_entrada)
  }

  const anticipadaMins = (m: MarcacionExt): number => {
    if (m.tipo !== 'salida' || !m.empleado?.hora_salida) return 0
    const fecha = new Date(m.timestamp).toISOString().slice(0, 10)
    if (getPermiso(m.empleado_id, fecha)) return 0
    return minsEarly(m.timestamp, m.empleado.hora_salida)
  }

  const confirmarEliminar = (m: Marcacion) => {
    const hora = new Date(m.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    setModal({
      title: 'Eliminar marcación',
      message: `¿Eliminar el registro de ${m.tipo} de las ${hora}? Esta acción no se puede deshacer.`,
      variant: 'danger', confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await supabase.from('marcaciones').delete().eq('id', m.id); cargar() },
    })
  }

  const exportarCSV = () => {
    const rows = [['Empleado', 'Cédula', 'Cargo', 'Tipo', 'Fecha', 'Hora', 'Tardanza (min)', 'Salida anticipada (min)', 'Permiso del día']]
    marcaciones.forEach(m => {
      const d = new Date(m.timestamp)
      const fecha = d.toISOString().slice(0, 10)
      const permiso = getPermiso(m.empleado_id, fecha)
      const tarde = tardanzaMins(m)
      const anticipado = anticipadaMins(m)
      rows.push([
        m.empleado?.nombre ?? '', m.empleado?.cedula ?? '', m.empleado?.cargo ?? '',
        m.tipo, d.toLocaleDateString('es-CO'), d.toLocaleTimeString('es-CO'),
        tarde > 0 ? String(tarde) : '',
        anticipado > 0 ? String(anticipado) : '',
        permiso?.nombre ?? '',
      ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `asistencia-${desde}-al-${hasta}.csv`
    a.click()
  }

  const fmtHora = (d: string) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const porDia = marcaciones.reduce<Record<string, MarcacionExt[]>>((acc, m) => {
    const dia = new Date(m.timestamp).toISOString().slice(0, 10)
    ;(acc[dia] ??= []).push(m); return acc
  }, {})
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

  const tituloDia = (iso: string) => new Date(iso + 'T12:00:00')
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  const horasDelDia = (lista: MarcacionExt[]) => {
    const ord = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    let ms = 0, entrada: number | null = null
    for (const m of ord) {
      if (m.tipo === 'entrada') entrada = new Date(m.timestamp).getTime()
      else if (m.tipo === 'salida' && entrada != null) { ms += new Date(m.timestamp).getTime() - entrada; entrada = null }
    }
    if (ms === 0) return null
    return `${Math.floor(ms / 3.6e6)}h ${Math.round((ms % 3.6e6) / 60000)}m`
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <button onClick={exportarCSV}
          className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0">
          <Download size={15} /> Exportar Excel
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-3">{marcaciones.length} marcaciones en el período</p>

      {marcaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-sm text-gray-400">
          No hay marcaciones en este período.
        </div>
      ) : (
        <div className="space-y-5">
          {dias.map(dia => {
            const porEmpleado = porDia[dia].reduce<Record<string, { marcas: MarcacionExt[]; id: string }>>((acc, m) => {
              const k = m.empleado?.nombre ?? m.empleado_id
              if (!acc[k]) acc[k] = { marcas: [], id: m.empleado_id }
              acc[k].marcas.push(m)
              return acc
            }, {})
            return (
              <div key={dia}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 capitalize">
                  {tituloDia(dia)}
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {Object.entries(porEmpleado).map(([nombre, { marcas, id }]) => {
                    const ordenado = [...marcas].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                    const horas = horasDelDia(marcas)
                    const permisoDia = getPermiso(id, dia)
                    return (
                      <div key={nombre} className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                              {nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-gray-900 truncate block">{nombre}</span>
                              {permisoDia && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 w-fit">
                                  <ShieldCheck size={9} /> {permisoDia.nombre}
                                  {permisoDia.hora_inicio && ` · ${permisoDia.hora_inicio}–${permisoDia.hora_fin}`}
                                </span>
                              )}
                            </div>
                          </div>
                          {horas && (
                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-full shrink-0 flex items-center gap-1">
                              <Clock size={10} /> {horas}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-10">
                          {ordenado.map(m => {
                            const tarde = tardanzaMins(m)
                            const anticipado = anticipadaMins(m)
                            const isLate = tarde > 0
                            const isEarly = anticipado > 0
                            return (
                              <span key={m.id}
                                className={`group inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                                  isLate ? 'bg-red-50 text-red-700'
                                  : isEarly ? 'bg-orange-50 text-orange-700'
                                  : m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700'
                                  : 'bg-orange-50 text-orange-600'
                                }`}
                              >
                                {isLate && <AlertTriangle size={9} className="shrink-0" />}
                                <span className="font-semibold capitalize">{m.tipo}</span>
                                <span className="tabular-nums">{fmtHora(m.timestamp)}</span>
                                {isLate && <span className="font-semibold">+{tarde}m</span>}
                                {isEarly && <span className="font-semibold">-{anticipado}m</span>}
                                <button onClick={() => confirmarEliminar(m)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition ml-0.5">
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal.title} message={modal.message} variant={modal.variant}
          confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onClose={() => setModal(null)} />
      )}
    </>
  )
}
