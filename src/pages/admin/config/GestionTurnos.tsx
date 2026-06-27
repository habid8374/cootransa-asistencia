import { useEffect, useState } from 'react'
import { supabase, type Turno, type TipoEmpleado } from '../../../lib/supabase'
import { Plus, Pencil, Trash2, X, Clock } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
const TIME = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-500 w-24'

interface DiaConfig {
  key: 'lv' | 'sab' | 'dom' | 'festivo'
  label: string
}
const DIAS: DiaConfig[] = [
  { key: 'lv', label: 'Lunes – Viernes' },
  { key: 'sab', label: 'Sábados' },
  { key: 'dom', label: 'Domingos' },
  { key: 'festivo', label: 'Festivos' },
]

interface FormState {
  nombre: string
  tipo_empleado_id: string
  lv_aplica: boolean;  lv_entrada: string; lv_salida: string
  sab_aplica: boolean; sab_entrada: string; sab_salida: string
  dom_aplica: boolean; dom_entrada: string; dom_salida: string
  fes_aplica: boolean; fes_entrada: string; fes_salida: string
}

const EMPTY: FormState = {
  nombre: '', tipo_empleado_id: '',
  lv_aplica: true,  lv_entrada: '07:00', lv_salida: '17:00',
  sab_aplica: false, sab_entrada: '07:00', sab_salida: '12:00',
  dom_aplica: false, dom_entrada: '08:00', dom_salida: '14:00',
  fes_aplica: false, fes_entrada: '08:00', fes_salida: '14:00',
}

function turnoToForm(t: Turno): FormState {
  return {
    nombre: t.nombre,
    tipo_empleado_id: t.tipo_empleado_id ?? '',
    lv_aplica:  !!t.hora_entrada_lv,   lv_entrada:  t.hora_entrada_lv ?? '07:00',  lv_salida:  t.hora_salida_lv ?? '17:00',
    sab_aplica: !!t.hora_entrada_sab,  sab_entrada: t.hora_entrada_sab ?? '07:00', sab_salida: t.hora_salida_sab ?? '12:00',
    dom_aplica: !!t.hora_entrada_dom,  dom_entrada: t.hora_entrada_dom ?? '08:00', dom_salida: t.hora_salida_dom ?? '14:00',
    fes_aplica: !!t.hora_entrada_festivo, fes_entrada: t.hora_entrada_festivo ?? '08:00', fes_salida: t.hora_salida_festivo ?? '14:00',
  }
}

export default function GestionTurnos() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [tipos, setTipos] = useState<TipoEmpleado[]>([])
  const [modal, setModal] = useState<'nuevo' | Turno | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')

  const cargar = async () => {
    const [{ data: ts }, { data: tp }] = await Promise.all([
      supabase.from('turnos').select('*, tipo_empleado:tipos_empleado(id, nombre)').order('nombre'),
      supabase.from('tipos_empleado').select('*').order('nombre'),
    ])
    setTurnos((ts as Turno[]) ?? [])
    setTipos((tp as TipoEmpleado[]) ?? [])
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setForm(EMPTY); setErr(''); setModal('nuevo') }
  const abrirEditar = (t: Turno) => { setForm(turnoToForm(t)); setErr(''); setModal(t) }
  const cerrar = () => setModal(null)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio.'); return }
    setGuardando(true); setErr('')
    const payload = {
      nombre: form.nombre.trim(),
      tipo_empleado_id: form.tipo_empleado_id || null,
      hora_entrada_lv:      form.lv_aplica  ? form.lv_entrada  : null,
      hora_salida_lv:       form.lv_aplica  ? form.lv_salida   : null,
      hora_entrada_sab:     form.sab_aplica ? form.sab_entrada : null,
      hora_salida_sab:      form.sab_aplica ? form.sab_salida  : null,
      hora_entrada_dom:     form.dom_aplica ? form.dom_entrada : null,
      hora_salida_dom:      form.dom_aplica ? form.dom_salida  : null,
      hora_entrada_festivo: form.fes_aplica ? form.fes_entrada : null,
      hora_salida_festivo:  form.fes_aplica ? form.fes_salida  : null,
    }
    let error
    if (modal === 'nuevo') {
      ({ error } = await supabase.from('turnos').insert(payload))
    } else {
      ({ error } = await supabase.from('turnos').update(payload).eq('id', (modal as Turno).id))
    }
    setGuardando(false)
    if (error) { setErr('Error al guardar: ' + error.message); return }
    cargar(); cerrar()
  }

  const eliminar = async (id: string) => {
    await supabase.from('turnos').delete().eq('id', id)
    cargar()
  }

  const set = (key: keyof FormState, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  const DiaRow = ({ dia }: { dia: DiaConfig }) => {
    const apKey = `${dia.key === 'festivo' ? 'fes' : dia.key}_aplica` as keyof FormState
    const enKey = `${dia.key === 'festivo' ? 'fes' : dia.key}_entrada` as keyof FormState
    const saKey = `${dia.key === 'festivo' ? 'fes' : dia.key}_salida` as keyof FormState
    const aplica = form[apKey] as boolean
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
          <input type="checkbox" checked={aplica} onChange={e => set(apKey, e.target.checked)}
            className="rounded accent-brand-600 w-3.5 h-3.5" />
          <span className={`text-sm font-medium ${aplica ? 'text-gray-800' : 'text-gray-400'}`}>{dia.label}</span>
        </label>
        {aplica ? (
          <div className="flex items-center gap-2">
            <input type="time" value={form[enKey] as string} onChange={e => set(enKey, e.target.value)} className={TIME} />
            <span className="text-gray-400 text-xs">–</span>
            <input type="time" value={form[saKey] as string} onChange={e => set(saKey, e.target.value)} className={TIME} />
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No trabaja</span>
        )}
      </div>
    )
  }

  const resumenTurno = (t: Turno) => {
    const partes: string[] = []
    if (t.hora_entrada_lv) partes.push(`L-V ${t.hora_entrada_lv}–${t.hora_salida_lv}`)
    if (t.hora_entrada_sab) partes.push(`Sáb ${t.hora_entrada_sab}–${t.hora_salida_sab}`)
    if (t.hora_entrada_dom) partes.push(`Dom ${t.hora_entrada_dom}–${t.hora_salida_dom}`)
    if (t.hora_entrada_festivo) partes.push(`Fest. ${t.hora_entrada_festivo}–${t.hora_salida_festivo}`)
    return partes.join(' · ') || 'Sin horarios'
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={abrirNuevo}
          className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
        >
          <Plus size={15} /> Nuevo turno
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {turnos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Aún no hay turnos creados.</p>
        ) : turnos.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
            <Clock size={15} className="text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">{t.nombre}</p>
                {t.tipo_empleado && (
                  <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                    {t.tipo_empleado.nombre}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{resumenTurno(t)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition">
                <Pencil size={14} />
              </button>
              <button onClick={() => eliminar(t.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={cerrar}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {modal === 'nuevo' ? 'Crear turno' : 'Editar turno'}
              </h2>
              <button onClick={cerrar} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombre del turno (ej: Turno Mañana Operativo)"
                required className={INPUT}
              />
              <select
                value={form.tipo_empleado_id}
                onChange={e => set('tipo_empleado_id', e.target.value)}
                className={INPUT}
              >
                <option value="">Tipo de empleado (opcional)</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Horarios por día</p>
                {DIAS.map(d => <DiaRow key={d.key} dia={d} />)}
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}
              <button
                type="submit" disabled={guardando}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar turno'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
