import { useEffect, useState } from 'react'
import { supabase, type Marcacion } from '../../lib/supabase'
import Modal from '../../components/Modal'
import { Download, Trash2, AlertTriangle } from 'lucide-react'

interface ModalState {
  title: string
  message: string
  variant?: 'danger'
  confirmLabel?: string
  onConfirm: () => void
}

export default function Reportes() {
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [modal, setModal] = useState<ModalState | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const [desde, setDesde] = useState(hace30)
  const [hasta, setHasta] = useState(hoy)

  const cargar = async () => {
    const desdeISO = new Date(desde + 'T00:00:00').toISOString()
    const hastaISO = new Date(hasta + 'T23:59:59').toISOString()
    const { data } = await supabase
      .from('marcaciones')
      .select('*, empleado:empleados(nombre, cedula, cargo, hora_entrada)')
      .gte('timestamp', desdeISO)
      .lte('timestamp', hastaISO)
      .order('timestamp', { ascending: false })
      .limit(500)
    setMarcaciones((data as unknown as Marcacion[]) ?? [])
  }

  useEffect(() => { cargar() }, [desde, hasta])

  const confirmarEliminar = (m: Marcacion) => {
    const hora = new Date(m.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    setModal({
      title: 'Eliminar marcación',
      message: `¿Eliminar el registro de ${m.tipo} de las ${hora}? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await supabase.from('marcaciones').delete().eq('id', m.id); cargar() },
    })
  }

  const esTardanza = (m: Marcacion) => {
    const horaEnt = (m.empleado as unknown as { hora_entrada?: string })?.hora_entrada
    if (m.tipo !== 'entrada' || !horaEnt) return false
    const [hh, mm] = horaEnt.split(':').map(Number)
    const esperada = new Date(m.timestamp); esperada.setHours(hh, mm, 0, 0)
    return new Date(m.timestamp) > esperada
  }

  const exportarCSV = () => {
    const rows = [['Empleado', 'Cédula', 'Cargo', 'Tipo', 'Fecha', 'Hora', 'Tardanza']]
    marcaciones.forEach(m => {
      const d = new Date(m.timestamp)
      rows.push([
        m.empleado?.nombre ?? '', m.empleado?.cedula ?? '', m.empleado?.cargo ?? '',
        m.tipo, d.toLocaleDateString('es-CO'), d.toLocaleTimeString('es-CO'),
        esTardanza(m) ? 'Sí' : '',
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

  const porDia = marcaciones.reduce<Record<string, Marcacion[]>>((acc, m) => {
    const dia = new Date(m.timestamp).toISOString().slice(0, 10)
    ;(acc[dia] ??= []).push(m)
    return acc
  }, {})
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a))

  const tituloDia = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const horasDelDia = (lista: Marcacion[]) => {
    const ord = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    let totalMs = 0, entrada: number | null = null
    for (const m of ord) {
      if (m.tipo === 'entrada') entrada = new Date(m.timestamp).getTime()
      else if (m.tipo === 'salida' && entrada != null) { totalMs += new Date(m.timestamp).getTime() - entrada; entrada = null }
    }
    if (totalMs === 0) return null
    const h = Math.floor(totalMs / 3.6e6), min = Math.round((totalMs % 3.6e6) / 60000)
    return `${h}h ${min}m`
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={exportarCSV}
          className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0"
        >
          <Download size={15} /> Exportar
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
            const porEmpleado = porDia[dia].reduce<Record<string, Marcacion[]>>((acc, m) => {
              const k = m.empleado?.nombre ?? m.empleado_id
              ;(acc[k] ??= []).push(m)
              return acc
            }, {})
            return (
              <div key={dia}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 capitalize">
                  {tituloDia(dia)}
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {Object.entries(porEmpleado).map(([nombre, lista]) => {
                    const ordenado = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                    const horas = horasDelDia(lista)
                    return (
                      <div key={nombre} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                              {nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate">{nombre}</span>
                          </div>
                          {horas && (
                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full shrink-0">
                              {horas} trabajadas
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-10">
                          {ordenado.map(m => {
                            const tarde = esTardanza(m)
                            return (
                              <span
                                key={m.id}
                                className={`group inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
                                  tarde ? 'bg-red-50 text-red-700'
                                  : m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700'
                                  : 'bg-orange-50 text-orange-600'
                                }`}
                              >
                                {tarde && <AlertTriangle size={10} className="shrink-0" />}
                                <span className="font-semibold capitalize">{m.tipo}</span>
                                <span className="tabular-nums">{fmtHora(m.timestamp)}</span>
                                <button
                                  onClick={() => confirmarEliminar(m)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition ml-0.5"
                                  title="Eliminar marcación"
                                >
                                  <Trash2 size={11} />
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
        <Modal
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
          confirmLabel={modal.confirmLabel}
          onConfirm={modal.onConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
