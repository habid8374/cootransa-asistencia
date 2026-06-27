import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion } from '../../lib/supabase'
import RegistrarEmpleado from './RegistrarEmpleado'
import EditarEmpleado from './EditarEmpleado'
import Modal from '../../components/Modal'
import { Users, ClipboardList, UserPlus, LogOut, Monitor, Trash2, Download, Pencil } from 'lucide-react'

type Tab = 'empleados' | 'reportes'

interface ModalState {
  title: string
  message: string
  variant?: 'danger' | 'default'
  confirmLabel?: string
  onConfirm: () => void
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('empleados')
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [showRegistrar, setShowRegistrar] = useState(false)
  const [editarEmpleado, setEditarEmpleado] = useState<Empleado | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)

  const cargarEmpleados = async () => {
    const { data } = await supabase.from('empleados').select('*').order('nombre')
    setEmpleados(data ?? [])
  }
  const cargarMarcaciones = async () => {
    const { data } = await supabase
      .from('marcaciones')
      .select('*, empleado:empleados(nombre, cedula, cargo)')
      .order('timestamp', { ascending: false })
      .limit(200)
    setMarcaciones((data as any) ?? [])
  }

  useEffect(() => { cargarEmpleados(); cargarMarcaciones() }, [])

  const confirmarEliminarEmpleado = (e: Empleado) => {
    setModal({
      title: 'Eliminar empleado',
      message: `¿Eliminar a ${e.nombre}? Esta acción también borrará todas sus marcaciones y no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        await supabase.from('marcaciones').delete().eq('empleado_id', e.id)
        await supabase.from('empleados').delete().eq('id', e.id)
        cargarEmpleados()
        cargarMarcaciones()
      },
    })
  }

  const confirmarEliminarMarcacion = (m: Marcacion) => {
    const hora = new Date(m.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    setModal({
      title: 'Eliminar marcación',
      message: `¿Eliminar el registro de ${m.tipo} de las ${hora}? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        await supabase.from('marcaciones').delete().eq('id', m.id)
        cargarMarcaciones()
      },
    })
  }

  const exportarCSV = () => {
    const rows = [['Empleado', 'Cédula', 'Cargo', 'Tipo', 'Fecha', 'Hora']]
    marcaciones.forEach(m => {
      const d = new Date(m.timestamp)
      rows.push([
        m.empleado?.nombre ?? '', m.empleado?.cedula ?? '', m.empleado?.cargo ?? '',
        m.tipo, d.toLocaleDateString('es-CO'), d.toLocaleTimeString('es-CO'),
      ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `asistencia-cootransa-${new Date().toISOString().slice(0, 10)}.csv`
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
    const ordenado = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    let totalMs = 0, entrada: number | null = null
    for (const m of ordenado) {
      if (m.tipo === 'entrada') entrada = new Date(m.timestamp).getTime()
      else if (m.tipo === 'salida' && entrada != null) { totalMs += new Date(m.timestamp).getTime() - entrada; entrada = null }
    }
    if (totalMs === 0) return null
    const h = Math.floor(totalMs / 3.6e6), min = Math.round((totalMs % 3.6e6) / 60000)
    return `${h}h ${min}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">COOTRANSA</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Asistencia</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/kiosco"
              target="_blank"
              className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-brand-100 transition"
            >
              <Monitor size={14} /> Abrir terminal
            </a>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('empleados')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${tab === 'empleados' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            <Users size={15} /> Empleados
          </button>
          <button
            onClick={() => setTab('reportes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${tab === 'reportes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            <ClipboardList size={15} /> Reportes
          </button>
        </div>

        {/* ── EMPLEADOS ── */}
        {tab === 'empleados' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{empleados.length} empleados registrados</p>
              <button
                onClick={() => setShowRegistrar(true)}
                className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <UserPlus size={15} /> Registrar empleado
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {empleados.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">Aún no hay empleados registrados.</p>
              ) : empleados.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {e.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.nombre}</p>
                      {e.pin
                        ? <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded shrink-0">PIN ✓</span>
                        : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">Sin PIN</span>
                      }
                    </div>
                    <p className="text-xs text-gray-400">{e.cedula}{e.cargo ? ` · ${e.cargo}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditarEmpleado(e)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition"
                      title="Editar empleado"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => confirmarEliminarEmpleado(e)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="Eliminar empleado"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── REPORTES ── */}
        {tab === 'reportes' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">Últimas {marcaciones.length} marcaciones</p>
              <button
                onClick={exportarCSV}
                className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download size={15} /> Exportar a Excel
              </button>
            </div>
            {marcaciones.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-sm text-gray-400">
                Aún no hay marcaciones.
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
                                {ordenado.map(m => (
                                  <span
                                    key={m.id}
                                    className={`group inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
                                      m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-600'
                                    }`}
                                  >
                                    <span className="font-semibold capitalize">{m.tipo}</span>
                                    <span className="tabular-nums">{fmtHora(m.timestamp)}</span>
                                    <button
                                      onClick={() => confirmarEliminarMarcacion(m)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition ml-0.5"
                                      title="Eliminar esta marcación"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </span>
                                ))}
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
          </>
        )}
      </div>

      {showRegistrar && (
        <RegistrarEmpleado onClose={() => setShowRegistrar(false)} onSaved={cargarEmpleados} />
      )}

      {editarEmpleado && (
        <EditarEmpleado
          empleado={editarEmpleado}
          onClose={() => setEditarEmpleado(null)}
          onSaved={() => { cargarEmpleados(); setEditarEmpleado(null) }}
        />
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
    </div>
  )
}
