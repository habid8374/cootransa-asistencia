import { useEffect, useState } from 'react'
import { supabase, type Marcacion, type Permiso } from '../../lib/supabase'
import Modal from '../../components/Modal'
import { Download, FileText, Trash2, AlertTriangle, ShieldCheck, Clock, Zap } from 'lucide-react'

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

  const extraMins = (m: MarcacionExt): number => {
    if (m.tipo !== 'salida' || !m.empleado?.hora_salida) return 0
    const fecha = new Date(m.timestamp).toISOString().slice(0, 10)
    if (getPermiso(m.empleado_id, fecha)) return 0
    return minsLate(m.timestamp, m.empleado.hora_salida)
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
    const rows = [['Empleado', 'Cédula', 'Cargo', 'Tipo', 'Fecha', 'Hora', 'Tardanza (min)', 'Salida anticipada (min)', 'Horas extra (min)', 'Permiso del día']]
    marcaciones.forEach(m => {
      const d = new Date(m.timestamp)
      const fecha = d.toISOString().slice(0, 10)
      const permiso = getPermiso(m.empleado_id, fecha)
      const tarde = tardanzaMins(m)
      const anticipado = anticipadaMins(m)
      const extra = extraMins(m)
      rows.push([
        m.empleado?.nombre ?? '', m.empleado?.cedula ?? '', m.empleado?.cargo ?? '',
        m.tipo, d.toLocaleDateString('es-CO'), d.toLocaleTimeString('es-CO'),
        tarde > 0 ? String(tarde) : '',
        anticipado > 0 ? String(anticipado) : '',
        extra > 0 ? String(extra) : '',
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

  const exportarPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const filas = marcaciones.map(m => {
      const d = new Date(m.timestamp)
      const fecha = d.toISOString().slice(0, 10)
      const permiso = getPermiso(m.empleado_id, fecha)
      const tarde = tardanzaMins(m)
      const anticipado = anticipadaMins(m)
      const extra = extraMins(m)
      return `<tr>
        <td>${m.empleado?.nombre ?? ''}</td>
        <td>${m.empleado?.cedula ?? ''}</td>
        <td>${m.empleado?.cargo ?? ''}</td>
        <td style="text-transform:capitalize">${m.tipo}</td>
        <td>${d.toLocaleDateString('es-CO')}</td>
        <td>${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="color:#dc2626;font-weight:600">${tarde > 0 ? `+${tarde}m` : ''}</td>
        <td style="color:#ea580c;font-weight:600">${anticipado > 0 ? `-${anticipado}m` : ''}</td>
        <td style="color:#7c3aed;font-weight:600">${extra > 0 ? `+${extra}m` : ''}</td>
        <td style="color:#2563eb;font-weight:600">${permiso?.nombre ?? ''}</td>
      </tr>`
    }).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Reporte de Asistencia – COOTRANSA</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;font-size:12px;color:#111}
  h1{font-size:18px;margin:0 0 4px}
  p.sub{color:#6b7280;margin:0 0 16px;font-size:11px}
  table{width:100%;border-collapse:collapse}
  th{background:#f9fafb;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb}
  td{padding:6px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
  @media print{body{margin:0}button{display:none}}
</style></head><body>
<h1>COOTRANSA Ltda. – Reporte de Asistencia</h1>
<p class="sub">Período: ${desde} al ${hasta} &nbsp;·&nbsp; Generado: ${new Date().toLocaleString('es-CO')} &nbsp;·&nbsp; ${marcaciones.length} marcaciones</p>
<table><thead><tr>
  <th>Empleado</th><th>Cédula</th><th>Cargo</th><th>Tipo</th><th>Fecha</th><th>Hora</th>
  <th>Tardanza</th><th>Sal. Ant.</th><th>H. Extra</th><th>Permiso</th>
</tr></thead><tbody>${filas}</tbody></table>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
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
        <div className="flex gap-2 shrink-0">
          <button onClick={exportarCSV}
            className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition">
            <Download size={15} /> Excel
          </button>
          <button onClick={exportarPDF}
            className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition">
            <FileText size={15} /> PDF
          </button>
        </div>
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
                            const extra = extraMins(m)
                            const isLate = tarde > 0
                            const isEarly = anticipado > 0
                            const isExtra = extra > 0
                            return (
                              <span key={m.id}
                                className={`group inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                                  isLate ? 'bg-red-50 text-red-700'
                                  : isExtra ? 'bg-purple-50 text-purple-700'
                                  : isEarly ? 'bg-orange-50 text-orange-700'
                                  : m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isLate && <AlertTriangle size={9} className="shrink-0" />}
                                {isExtra && <Zap size={9} className="shrink-0" />}
                                <span className="font-semibold capitalize">{m.tipo}</span>
                                <span className="tabular-nums">{fmtHora(m.timestamp)}</span>
                                {isLate && <span className="font-semibold">+{tarde}m</span>}
                                {isEarly && <span className="font-semibold">-{anticipado}m</span>}
                                {isExtra && <span className="font-semibold">+{extra}m extra</span>}
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
