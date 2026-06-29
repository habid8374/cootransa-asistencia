import { useEffect, useState } from 'react'
import { supabase, type Empleado, type TipoEmpleado } from '../../lib/supabase'
import RegistrarEmpleado from './RegistrarEmpleado'
import EditarEmpleado from './EditarEmpleado'
import HistorialEmpleado from './HistorialEmpleado'
import Dashboard from './Dashboard'
import Reportes from './Reportes'
import ResumenMensual from './ResumenMensual'
import Permisos from './Permisos'
import Tendencias from './Tendencias'
import Configuracion from './Configuracion'
import Modal from '../../components/Modal'
import {
  Users, ClipboardList, UserPlus, LogOut, Monitor, Trash2, Pencil,
  LayoutDashboard, BarChart3, ShieldCheck, TrendingUp, History,
  Power, Settings, Menu, ChevronDown, BookOpen,
} from 'lucide-react'

type Tab = 'hoy' | 'empleados' | 'permisos' | 'reportes' | 'mensual' | 'tendencias' | 'config'

interface ModalState {
  title: string
  message: string
  variant?: 'danger' | 'default'
  confirmLabel?: string
  onConfirm: () => void
}

const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'hoy',        label: 'Hoy',           icon: <LayoutDashboard size={18} /> },
  { key: 'empleados',  label: 'Empleados',      icon: <Users size={18} /> },
  { key: 'permisos',   label: 'Permisos',       icon: <ShieldCheck size={18} /> },
  { key: 'reportes',   label: 'Reportes',       icon: <ClipboardList size={18} /> },
  { key: 'mensual',    label: 'Mensual',        icon: <BarChart3 size={18} /> },
  { key: 'tendencias', label: 'Tendencias',     icon: <TrendingUp size={18} /> },
  { key: 'config',     label: 'Configuración',  icon: <Settings size={18} /> },
]

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('hoy')
  const [open, setOpen] = useState(true)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [showRegistrar, setShowRegistrar] = useState(false)
  const [editarEmpleado, setEditarEmpleado] = useState<Empleado | null>(null)
  const [historialEmpleado, setHistorialEmpleado] = useState<Empleado | null>(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [tipos, setTipos] = useState<TipoEmpleado[]>([])
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Set<string>>(new Set())

  const toggleCategoria = (id: string) =>
    setCategoriasAbiertas(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const cargarEmpleados = async () => {
    const [{ data: emps }, { data: tps }] = await Promise.all([
      supabase.from('empleados').select('*, tipo_empleado:tipos_empleado(id, nombre)').order('nombre'),
      supabase.from('tipos_empleado').select('*').order('nombre'),
    ])
    setEmpleados((emps as Empleado[]) ?? [])
    setTipos((tps as TipoEmpleado[]) ?? [])
  }

  useEffect(() => { cargarEmpleados() }, [])

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
      },
    })
  }

  const confirmarToggleActivo = (e: Empleado) => {
    const desactivar = e.activo
    setModal({
      title: desactivar ? 'Desactivar empleado' : 'Reactivar empleado',
      message: desactivar
        ? `¿Desactivar a ${e.nombre}? No podrá usar el terminal pero su historial se conserva.`
        : `¿Reactivar a ${e.nombre}? Podrá volver a marcar asistencia en el terminal.`,
      variant: desactivar ? 'danger' : 'default',
      confirmLabel: desactivar ? 'Sí, desactivar' : 'Sí, reactivar',
      onConfirm: async () => {
        await supabase.from('empleados').update({ activo: !e.activo }).eq('id', e.id)
        cargarEmpleados()
      },
    })
  }

  const titulo = NAV.find(n => n.key === tab)?.label ?? ''

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${open ? 'w-60' : 'w-16'} bg-gray-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out`}>

        {/* Marca + toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/5 flex-shrink-0">
          {open && (
            <div className="overflow-hidden mr-2">
              <p className="text-white font-bold text-sm leading-tight truncate">COOTRANSA</p>
              <p className="text-gray-500 text-[9px] uppercase tracking-widest">Asistencia</p>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0 ml-auto"
            title={open ? 'Colapsar menú' : 'Expandir menú'}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              title={!open ? n.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === n.key
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex-shrink-0">{n.icon}</span>
              {open && <span className="truncate">{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* Pie del sidebar */}
        <div className="px-2 pb-3 pt-2 border-t border-white/5 space-y-0.5 flex-shrink-0">
          <a
            href="/terminal"
            target="_blank"
            title={!open ? 'Terminal de marcación' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Monitor size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Terminal</span>}
          </a>
          <a
            href="/admin/manual"
            target="_blank"
            title={!open ? 'Manual de usuario' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <BookOpen size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Manual de usuario</span>}
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            title={!open ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Cerrar sesión</span>}
          </button>

        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra superior */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-gray-800">{titulo}</h1>
        </header>

        {/* Área scrolleable */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">

            {tab === 'hoy' && <Dashboard />}

            {tab === 'empleados' && (() => {
              const visibles = empleados.filter(e => e.activo || mostrarInactivos)

              // Agrupar por categoría
              const grupos: Record<string, Empleado[]> = {}
              for (const e of visibles) {
                const cat = (e.tipo_empleado as TipoEmpleado | undefined)?.nombre ?? 'Sin categoría'
                ;(grupos[cat] ??= []).push(e)
              }
              const ordenGrupos = [
                ...tipos.map(t => t.nombre).filter(n => grupos[n]),
                ...('Sin categoría' in grupos ? ['Sin categoría'] : []),
              ]

              return (
                <>
                  <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">
                        {empleados.filter(e => e.activo).length} activos
                        {empleados.some(e => !e.activo) && ` · ${empleados.filter(e => !e.activo).length} inactivos`}
                      </p>
                      {empleados.some(e => !e.activo) && (
                        <button
                          onClick={() => setMostrarInactivos(v => !v)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${mostrarInactivos ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {mostrarInactivos ? 'Ocultar inactivos' : 'Ver inactivos'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowRegistrar(true)}
                      className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <UserPlus size={15} /> Registrar empleado
                    </button>
                  </div>

                  {visibles.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-sm text-gray-400">
                      Aún no hay empleados registrados.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ordenGrupos.map(catNombre => {
                        const emps = grupos[catNombre] ?? []
                        const abierto = categoriasAbiertas.has(catNombre)
                        const activos = emps.filter(e => e.activo).length
                        return (
                          <div key={catNombre} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            {/* Header acordeón */}
                            <button
                              onClick={() => toggleCategoria(catNombre)}
                              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                                  <Users size={15} className="text-brand-600" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-gray-900">{catNombre}</p>
                                  <p className="text-xs text-gray-400">
                                    {activos} activo{activos !== 1 ? 's' : ''}
                                    {emps.length > activos && ` · ${emps.length - activos} inactivo${emps.length - activos !== 1 ? 's' : ''}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {emps.length}
                                </span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {/* Contenido desplegable */}
                            {abierto && (
                              <div className="border-t border-gray-100 divide-y divide-gray-50">
                                {emps.map(e => (
                                  <div key={e.id} className={`px-4 py-4 transition ${!e.activo ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                      <div className="shrink-0 relative">
                                        {e.foto_url ? (
                                          <img src={e.foto_url} className="w-11 h-11 rounded-full object-cover" alt={e.nombre} />
                                        ) : (
                                          <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                                            {e.nombre.slice(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                        {!e.activo && (
                                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                                            <Power size={8} className="text-white" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-semibold text-gray-900">{e.nombre}</p>
                                          {!e.activo
                                            ? <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">Inactivo</span>
                                            : e.pin
                                            ? <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">PIN ✓</span>
                                            : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Sin PIN</span>
                                          }
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{e.cedula}</p>
                                        {(e.cargo || e.hora_entrada) && (
                                          <p className="text-xs text-gray-400">
                                            {e.cargo}{e.hora_entrada ? ` · Entrada: ${e.hora_entrada}` : ''}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                                      <button onClick={() => setHistorialEmpleado(e)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition">
                                        <History size={14} /> Historial
                                      </button>
                                      <button onClick={() => setEditarEmpleado(e)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition">
                                        <Pencil size={14} /> Editar
                                      </button>
                                      <button
                                        onClick={() => confirmarToggleActivo(e)}
                                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${e.activo ? 'text-gray-500 hover:text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                                      >
                                        <Power size={14} /> {e.activo ? 'Desactivar' : 'Reactivar'}
                                      </button>
                                      <button onClick={() => confirmarEliminarEmpleado(e)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition">
                                        <Trash2 size={14} /> Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}

            {tab === 'permisos'   && <Permisos />}
            {tab === 'reportes'   && <Reportes />}
            {tab === 'mensual'    && <ResumenMensual />}
            {tab === 'tendencias' && <Tendencias />}
            {tab === 'config'     && <Configuracion />}

          </div>
        </main>

        {/* Footer Powered by Axentiatech */}
        <footer className="border-t border-gray-100 bg-white px-6 py-2.5 flex items-center justify-center gap-2 flex-shrink-0">
          <img src="/axentiatech-logo.jpg" alt="Axentiatech" className="w-5 h-5 rounded object-contain" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Powered by</span>
          <span className="text-[11px] font-bold text-gray-500">Axentiatech</span>
        </footer>
      </div>

      {/* ── Modales ── */}
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
      {historialEmpleado && (
        <HistorialEmpleado empleado={historialEmpleado} onClose={() => setHistorialEmpleado(null)} />
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
