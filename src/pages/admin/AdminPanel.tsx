import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion } from '../../lib/supabase'
import RegistrarEmpleado from './RegistrarEmpleado'
import { Users, ClipboardList, UserPlus, LogOut, Monitor, Trash2, Download } from 'lucide-react'

type Tab = 'empleados' | 'reportes'

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('empleados')
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [showRegistrar, setShowRegistrar] = useState(false)

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

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este empleado? También se borrarán sus marcaciones.')) return
    await supabase.from('marcaciones').delete().eq('empleado_id', id)
    await supabase.from('empleados').delete().eq('id', id)
    cargarEmpleados()
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

  const fmt = (d: string) => new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">COOTRANSA</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">Asistencia</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/kiosco" target="_blank" className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-brand-100">
              <Monitor size={14} /> Abrir kiosco
            </a>
            <button onClick={() => supabase.auth.signOut()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setTab('empleados')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${tab === 'empleados' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <Users size={15} /> Empleados
          </button>
          <button onClick={() => setTab('reportes')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${tab === 'reportes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            <ClipboardList size={15} /> Reportes
          </button>
        </div>

        {tab === 'empleados' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{empleados.length} empleados registrados</p>
              <button onClick={() => setShowRegistrar(true)} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5">
                <UserPlus size={15} /> Registrar empleado
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {empleados.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">Aún no hay empleados registrados.</p>
              ) : empleados.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {e.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.nombre}</p>
                    <p className="text-xs text-gray-400">{e.cedula}{e.cargo ? ` · ${e.cargo}` : ''}</p>
                  </div>
                  <button onClick={() => eliminar(e.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'reportes' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">Últimas {marcaciones.length} marcaciones</p>
              <button onClick={exportarCSV} className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg flex items-center gap-1.5">
                <Download size={15} /> Exportar a Excel
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {marcaciones.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">Aún no hay marcaciones.</p>
              ) : marcaciones.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${m.tipo === 'entrada' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-600'}`}>
                    {m.tipo}
                  </span>
                  <span className="flex-1 text-sm text-gray-900 truncate">{m.empleado?.nombre ?? '—'}</span>
                  <span className="text-xs text-gray-400">{fmt(m.timestamp)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showRegistrar && <RegistrarEmpleado onClose={() => setShowRegistrar(false)} onSaved={cargarEmpleados} />}
    </div>
  )
}
