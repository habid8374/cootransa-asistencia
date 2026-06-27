import { useEffect, useState } from 'react'
import { supabase, type Ruta } from '../../../lib/supabase'
import { Plus, Pencil, Trash2, MapPin, X, Clock, DollarSign } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

interface Form { origen: string; destino: string; precio_base: string; duracion_min: string }
const EMPTY: Form = { origen: '', destino: '', precio_base: '', duracion_min: '' }

export default function GestionRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [modal, setModal] = useState<'nueva' | Ruta | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')

  const cargar = async () => {
    const { data } = await supabase.from('rutas').select('*').order('origen')
    setRutas(data ?? [])
  }
  useEffect(() => { cargar() }, [])

  const abrir = (r?: Ruta) => {
    setErr('')
    if (r) {
      setForm({ origen: r.origen, destino: r.destino, precio_base: String(r.precio_base), duracion_min: String(r.duracion_min ?? '') })
      setModal(r)
    } else {
      setForm(EMPTY)
      setModal('nueva')
    }
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.origen.trim() || !form.destino.trim() || !form.precio_base) { setErr('Completa los campos requeridos.'); return }
    setGuardando(true); setErr('')
    const payload = {
      origen: form.origen.trim(),
      destino: form.destino.trim(),
      precio_base: parseFloat(form.precio_base),
      duracion_min: form.duracion_min ? parseInt(form.duracion_min) : null,
    }
    const { error } = modal === 'nueva'
      ? await supabase.from('rutas').insert(payload)
      : await supabase.from('rutas').update(payload).eq('id', (modal as Ruta).id)
    setGuardando(false)
    if (error) { setErr('Error: ' + error.message); return }
    cargar(); setModal(null)
  }

  const toggleActiva = async (r: Ruta) => {
    await supabase.from('rutas').update({ activa: !r.activa }).eq('id', r.id)
    cargar()
  }

  const eliminar = async (id: string) => {
    await supabase.from('rutas').delete().eq('id', id)
    cargar()
  }

  const fmt = (min?: number) => {
    if (!min) return ''
    const h = Math.floor(min / 60), m = min % 60
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={() => abrir()} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
          <Plus size={15} /> Nueva ruta
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rutas.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Sin rutas. Agrega la primera.</p>
        ) : rutas.map(r => (
          <div key={r.id} className={`flex items-center gap-3 px-4 py-3.5 ${!r.activa ? 'opacity-50' : ''}`}>
            <MapPin size={15} className="text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{r.origen} → {r.destino}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <DollarSign size={11} /> ${r.precio_base.toLocaleString('es-CO')}
                </span>
                {r.duracion_min && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> {fmt(r.duracion_min)}
                  </span>
                )}
                {!r.activa && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactiva</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleActiva(r)} className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${r.activa ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                {r.activa ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => abrir(r)} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition"><Pencil size={14} /></button>
              <button onClick={() => eliminar(r.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{modal === 'nueva' ? 'Nueva ruta' : 'Editar ruta'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-3">
              <input value={form.origen} onChange={e => setForm(f => ({ ...f, origen: e.target.value }))} placeholder="Ciudad de origen *" required className={INPUT} />
              <input value={form.destino} onChange={e => setForm(f => ({ ...f, destino: e.target.value }))} placeholder="Ciudad de destino *" required className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Precio base (COP) *</label>
                  <input type="number" value={form.precio_base} onChange={e => setForm(f => ({ ...f, precio_base: e.target.value }))} placeholder="15000" required className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duración (min)</label>
                  <input type="number" value={form.duracion_min} onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} placeholder="90" className={INPUT} />
                </div>
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button type="submit" disabled={guardando} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar ruta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
