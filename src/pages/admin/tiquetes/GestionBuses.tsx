import { useEffect, useState } from 'react'
import { supabase, type Bus } from '../../../lib/supabase'
import { Plus, Pencil, Trash2, Bus as BusIcon, X } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

interface Form { placa: string; nombre: string; capacidad: string }
const EMPTY: Form = { placa: '', nombre: '', capacidad: '40' }

export default function GestionBuses() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [modal, setModal] = useState<'nuevo' | Bus | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')

  const cargar = async () => {
    const { data } = await supabase.from('buses').select('*').order('nombre')
    setBuses(data ?? [])
  }
  useEffect(() => { cargar() }, [])

  const abrir = (b?: Bus) => {
    setErr('')
    if (b) {
      setForm({ placa: b.placa, nombre: b.nombre ?? '', capacidad: String(b.capacidad) })
      setModal(b)
    } else {
      setForm(EMPTY)
      setModal('nuevo')
    }
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.placa.trim() || !form.capacidad) { setErr('Placa y capacidad son requeridos.'); return }
    setGuardando(true); setErr('')
    const payload = {
      placa: form.placa.trim().toUpperCase(),
      nombre: form.nombre.trim() || null,
      capacidad: parseInt(form.capacidad),
    }
    const { error } = modal === 'nuevo'
      ? await supabase.from('buses').insert(payload)
      : await supabase.from('buses').update(payload).eq('id', (modal as Bus).id)
    setGuardando(false)
    if (error) { setErr(error.message.includes('unique') ? 'Esa placa ya está registrada.' : 'Error: ' + error.message); return }
    cargar(); setModal(null)
  }

  const toggleActivo = async (b: Bus) => {
    await supabase.from('buses').update({ activo: !b.activo }).eq('id', b.id)
    cargar()
  }

  const eliminar = async (id: string) => {
    await supabase.from('buses').delete().eq('id', id)
    cargar()
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={() => abrir()} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
          <Plus size={15} /> Agregar vehículo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {buses.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Sin vehículos registrados.</p>
        ) : buses.map(b => (
          <div key={b.id} className={`flex items-center gap-3 px-4 py-3.5 ${!b.activo ? 'opacity-50' : ''}`}>
            <BusIcon size={15} className="text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{b.nombre || b.placa}</p>
              <p className="text-xs text-gray-400">{b.nombre ? b.placa + ' · ' : ''}{b.capacidad} pasajeros</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!b.activo && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mr-1">Inactivo</span>}
              <button onClick={() => toggleActivo(b)} className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${b.activo ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                {b.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => abrir(b)} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition"><Pencil size={14} /></button>
              <button onClick={() => eliminar(b.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{modal === 'nuevo' ? 'Agregar vehículo' : 'Editar vehículo'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-3">
              <input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} placeholder="Placa (ej: CRQ 123) *" required className={INPUT} />
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre o descripción (opcional)" className={INPUT} />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Capacidad de pasajeros *</label>
                <input type="number" value={form.capacidad} onChange={e => setForm(f => ({ ...f, capacidad: e.target.value }))} required className={INPUT} />
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button type="submit" disabled={guardando} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
