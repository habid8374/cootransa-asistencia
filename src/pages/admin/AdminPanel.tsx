import { useEffect, useState } from 'react'
import { supabase, type Empleado } from '../../lib/supabase'
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
  Power, Settings, Menu,
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

  const cargarEmpleados = async () => {
    const { data } = await supabase.from('empleados').select('*').order('nombre')
    setEmpleados(data ?? [])
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
            href="/kiosco"
            target="_blank"
            title={!open ? 'Terminal de marcación' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Monitor size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Terminal</span>}
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

            {tab === 'empleados' && (
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
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {empleados.filter(e => e.activo || mostrarInactivos).length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-12">Aún no hay empleados registrados.</p>
                  ) : empleados.filter(e => e.activo || mostrarInactivos).map(e => (
                    <div key={e.id} className={`flex items-center gap-3 px-5 py-3.5 transition ${!e.activo ? 'opacity-50' : ''}`}>
                      <div className="shrink-0 relative">
                        {e.foto_url ? (
                          <img src={e.foto_url} className="w-9 h-9 rounded-full object-cover" alt={e.nombre} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                            {e.nombre.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {!e.activo && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Power size={7} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{e.nombre}</p>
                          {!e.activo
                            ? <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">Inactivo</span>
                            : e.pin
                            ? <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded shrink-0">PIN ✓</span>
                            : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">Sin PIN</span>
                          }
                        </div>
                        <p className="text-xs text-gray-400">
                          {e.cedula}{e.cargo ? ` · ${e.cargo}` : ''}{e.hora_entrada ? ` · Entrada: ${e.hora_entrada}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setHistorialEmpleado(e)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition" title="Ver historial">
                          <History size={15} />
                        </button>
                        <button onClick={() => setEditarEmpleado(e)} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition" title="Editar empleado">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => confirmarToggleActivo(e)}
                          className={`p-1.5 rounded-lg transition ${e.activo ? 'text-gray-300 hover:text-orange-500 hover:bg-orange-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={e.activo ? 'Desactivar empleado' : 'Reactivar empleado'}
                        >
                          <Power size={15} />
                        </button>
                        <button onClick={() => confirmarEliminarEmpleado(e)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition" title="Eliminar empleado">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'permisos'   && <Permisos />}
            {tab === 'reportes'   && <Reportes />}
            {tab === 'mensual'    && <ResumenMensual />}
            {tab === 'tendencias' && <Tendencias />}
            {tab === 'config'     && <Configuracion />}

          </div>
        </main>
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
