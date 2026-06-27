import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Permiso } from '../../lib/supabase'
import Modal from '../../components/Modal'
import { Plus, Trash2, ShieldCheck, X, Search } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

const NOMBRES_COMUNES = [
  'Permiso de Elecciones',
  'Cita Médica',
  'Calamidad Doméstica',
  'Duelo',
  'Licencia de Maternidad',
  'Licencia de Paternidad',
  'Comisión de Servicio',
  'Suspensión',
  'Permiso Sindical',
  'Otro',
]

type TipoHorario = 'dia_completo' | 'medio_dia_manana' | 'medio_dia_tarde' | 'personalizado'

interface ModalState {
  title: string; message: string; variant?: 'danger'; confirmLabel?: string; onConfirm: () => void
}

export default function Permisos() {
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [showForm, setShowForm] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // Form state
  const [empId, setEmpId] = useState('')
  const [empBusq, setEmpBusq] = useState('')
  const [nombre, setNombre] = useState('')
  const [nombreCustom, setNombreCustom] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState<TipoHorario>('dia_completo')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFin, setHoraFin] = useState('12:00')
  const [guardando, setGuardando] = useState(false)
  const [formMsg, setFormMsg] = useState('')

  const cargar = async () => {
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('permisos')
        .select('*, empleado:empleados(nombre, cedula)')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('empleados').select('*').eq('activo', true).order('nombre'),
    ])
    setPermisos((p as unknown as Permiso[]) ?? [])
    setEmpleados((e as Empleado[]) ?? [])
  }

  useEffect(() => { cargar() }, [])

  const empSeleccionado = empleados.find(e => e.id === empId)

  const horasParaTipo = (t: TipoHorario, emp?: Empleado): { inicio?: string; fin?: string } => {
    switch (t) {
      case 'dia_completo': return {}
      case 'medio_dia_manana': return { inicio: emp?.hora_entrada ?? '08:00', fin: '12:00' }
      case 'medio_dia_tarde': return { inicio: '13:00', fin: emp?.hora_salida ?? '17:00' }
      case 'personalizado': return { inicio: horaInicio, fin: horaFin }
    }
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombreFinal = nombre === 'Otro' ? nombreCustom.trim() : nombre
    if (!empId) { setFormMsg('Seleccione un empleado.'); return }
    if (!nombreFinal) { setFormMsg('Ingrese el nombre del permiso.'); return }
    if (!fecha) { setFormMsg('Seleccione la fecha.'); return }

    const horas = horasParaTipo(tipo, empSeleccionado)
    setGuardando(true)
    const { error } = await supabase.from('permisos').insert({
      empleado_id: empId,
      nombre: nombreFinal,
      fecha,
      hora_inicio: horas.inicio ?? null,
      hora_fin: horas.fin ?? null,
    })
    setGuardando(false)
    if (error) { setFormMsg('Error al guardar: ' + error.message); return }
    setShowForm(false)
    resetForm()
    cargar()
  }

  const resetForm = () => {
    setEmpId(''); setEmpBusq(''); setNombre(''); setNombreCustom('')
    setFecha(new Date().toISOString().slice(0, 10))
    setTipo('dia_completo'); setHoraInicio('08:00'); setHoraFin('12:00')
    setFormMsg('')
  }

  const confirmarEliminar = (p: Permiso) => {
    const empNombre = (p.empleado as any)?.nombre ?? 'empleado'
    setModal({
      title: 'Eliminar permiso',
      message: `¿Eliminar el permiso "${p.nombre}" de ${empNombre} del ${new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-CO')}? Esta acción no se puede deshacer.`,
      variant: 'danger', confirmLabel: 'Sí, eliminar',
      onConfirm: async () => { await supabase.from('permisos').delete().eq('id', p.id); cargar() },
    })
  }

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00')
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  const permisosFiltrados = busqueda
    ? permisos.filter(p => {
        const emp = p.empleado as any
        return (emp?.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase())
          || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      })
    : permisos

  const porFecha = permisosFiltrados.reduce<Record<string, Permiso[]>>((acc, p) => {
    ;(acc[p.fecha] ??= []).push(p); return acc
  }, {})
  const fechas = Object.keys(porFecha).sort((a, b) => b.localeCompare(a))

  const empsFiltrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(empBusq.toLowerCase()) || e.cedula.includes(empBusq)
  )

  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar empleado o permiso..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm() }}
          className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0"
        >
          <Plus size={15} /> Crear permiso
        </button>
      </div>

      {permisos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <ShieldCheck size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 mb-1">No hay permisos registrados</p>
          <p className="text-xs text-gray-300">Crea permisos para justificar ausencias o llegadas tarde</p>
        </div>
      ) : fechas.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">Sin resultados para la búsqueda.</p>
      ) : (
        <div className="space-y-5">
          {fechas.map(fecha => (
            <div key={fecha}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 capitalize">
                {fmtFecha(fecha)}
              </h3>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {porFecha[fecha].map(p => {
                  const emp = p.empleado as any
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{emp?.nombre ?? '—'}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-blue-600 font-medium">{p.nombre}</span>
                          <span className="text-xs text-gray-400">
                            {!p.hora_inicio ? 'Día completo'
                              : `${p.hora_inicio.slice(0,5)} – ${p.hora_fin?.slice(0,5) ?? '?'}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => confirmarEliminar(p)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                        title="Eliminar permiso"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
          onClick={() => setShowForm(false)}>
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Crear permiso</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardar} className="p-5 space-y-4">
              {/* Empleado */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Empleado <span className="text-red-400">*</span></label>
                <div className="relative mb-1.5">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={empBusq}
                    onChange={e => { setEmpBusq(e.target.value); setEmpId('') }}
                    placeholder="Buscar empleado..."
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                {empBusq && !empId && (
                  <div className="border border-gray-100 rounded-lg max-h-36 overflow-y-auto divide-y divide-gray-50">
                    {empsFiltrados.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3 text-center">Sin resultados</p>
                    ) : empsFiltrados.map(e => (
                      <button key={e.id} type="button"
                        onClick={() => { setEmpId(e.id); setEmpBusq(e.nombre) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {e.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{e.nombre}</p>
                          <p className="text-xs text-gray-400">{e.cedula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {empId && empSeleccionado && (
                  <p className="text-xs text-brand-600 flex items-center gap-1 mt-1">
                    ✓ {empSeleccionado.nombre}
                    {empSeleccionado.hora_entrada && ` · Horario: ${empSeleccionado.hora_entrada} – ${empSeleccionado.hora_salida ?? '?'}`}
                  </p>
                )}
              </div>

              {/* Nombre del permiso */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Tipo de permiso <span className="text-red-400">*</span></label>
                <select value={nombre} onChange={e => setNombre(e.target.value)} className={INPUT} required>
                  <option value="">Seleccionar...</option>
                  {NOMBRES_COMUNES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {nombre === 'Otro' && (
                  <input
                    className={INPUT + ' mt-2'}
                    placeholder="Nombre del permiso..."
                    value={nombreCustom}
                    onChange={e => setNombreCustom(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Fecha <span className="text-red-400">*</span></label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={INPUT} required />
              </div>

              {/* Horario del permiso */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Duración</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['dia_completo', 'Día completo'],
                    ['medio_dia_manana', 'Medio día mañana'],
                    ['medio_dia_tarde', 'Medio día tarde'],
                    ['personalizado', 'Horas específicas'],
                  ] as [TipoHorario, string][]).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTipo(val)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                        tipo === val
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Previsualización de horas */}
                {tipo !== 'dia_completo' && (
                  <div className="mt-3 space-y-2">
                    {tipo === 'personalizado' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                          <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={INPUT} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                          <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={INPUT} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        {tipo === 'medio_dia_manana'
                          ? `Horario: ${empSeleccionado?.hora_entrada ?? '08:00'} – 12:00`
                          : `Horario: 13:00 – ${empSeleccionado?.hora_salida ?? '17:00'}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {formMsg && <p className="text-sm text-red-600">{formMsg}</p>}

              <button
                type="submit"
                disabled={guardando}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar permiso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal.title} message={modal.message} variant={modal.variant}
          confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onClose={() => setModal(null)} />
      )}
    </>
  )
}
