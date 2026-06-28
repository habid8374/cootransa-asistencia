import { useEffect, useState } from 'react'
import { supabase, type Ruta } from '../../../lib/supabase'
import { Plus, Pencil, Trash2, MapPin, X, Clock, ArrowRight, GripVertical } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

interface Form {
  origen: string; destino: string; precio_base: string
  duracion_min: string; paradas: string[]
}
const EMPTY: Form = { origen: '', destino: '', precio_base: '', duracion_min: '', paradas: [] }

export default function GestionRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [modal, setModal] = useState<'nueva' | Ruta | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [nuevaParada, setNuevaParada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')

  const cargar = async () => {
    const { data } = await supabase.from('rutas').select('*').order('origen')
    setRutas(data ?? [])
  }
  useEffect(() => { cargar() }, [])

  const abrir = (r?: Ruta) => {
    setErr(''); setNuevaParada('')
    if (r) {
      setForm({
        origen: r.origen, destino: r.destino,
        precio_base: String(r.precio_base),
        duracion_min: String(r.duracion_min ?? ''),
        paradas: r.paradas ?? [],
      })
      setModal(r)
    } else {
      setForm(EMPTY)
      setModal('nueva')
    }
  }

  const agregarParada = () => {
    const p = nuevaParada.trim()
    if (!p || form.paradas.includes(p)) return
    setForm(f => ({ ...f, paradas: [...f.paradas, p] }))
    setNuevaParada('')
  }

  const quitarParada = (i: number) =>
    setForm(f => ({ ...f, paradas: f.paradas.filter((_, j) => j !== i) }))

  const moverParada = (i: number, dir: -1 | 1) => {
    const arr = [...form.paradas]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setForm(f => ({ ...f, paradas: arr }))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.origen.trim() || !form.destino.trim()) { setErr('Origen y destino son requeridos.'); return }
    if (form.paradas.length > 0 && !form.paradas.includes(form.origen.trim())) {
      setErr('La primera parada debe coincidir con el origen.'); return
    }
    setGuardando(true); setErr('')

    const paradas = form.paradas.length >= 2 ? form.paradas : null
    const precioBase = parseFloat(form.precio_base) || 0

    const payload = {
      origen: form.origen.trim(),
      destino: form.destino.trim(),
      precio_base: precioBase,
      duracion_min: form.duracion_min ? parseInt(form.duracion_min) : null,
      paradas,
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
          <Plus size={15} /> Nueva línea / ruta
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rutas.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Sin rutas. Agrega la primera.</p>
        ) : rutas.map(r => (
          <div key={r.id} className={`px-4 py-3.5 ${!r.activa ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-brand-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{r.origen} → {r.destino}</p>

                {/* Paradas intermedias */}
                {r.paradas && r.paradas.length > 2 && (
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {r.paradas.map((p, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">{p}</span>
                        {i < r.paradas!.length - 1 && <ArrowRight size={9} className="text-gray-300" />}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-1">
                  {r.precio_base > 0 && (
                    <span className="text-xs text-gray-400">${r.precio_base.toLocaleString('es-CO')} base</span>
                  )}
                  {r.duracion_min && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {fmt(r.duracion_min)}
                    </span>
                  )}
                  {r.paradas && r.paradas.length > 0 && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {r.paradas.length} paradas
                    </span>
                  )}
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
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{modal === 'nueva' ? 'Nueva línea / ruta' : 'Editar'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Origen *</label>
                  <input value={form.origen} onChange={e => setForm(f => ({ ...f, origen: e.target.value }))} placeholder="Sabanalarga" required className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Destino *</label>
                  <input value={form.destino} onChange={e => setForm(f => ({ ...f, destino: e.target.value }))} placeholder="Barranquilla" required className={INPUT} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Precio base (COP)</label>
                  <input type="number" value={form.precio_base} onChange={e => setForm(f => ({ ...f, precio_base: e.target.value }))} placeholder="15000" className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duración (min)</label>
                  <input type="number" value={form.duracion_min} onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} placeholder="90" className={INPUT} />
                </div>
              </div>

              {/* Paradas */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-semibold">
                  Paradas en orden (origen → destino)
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Si la línea tiene paradas intermedias, agrégalas en orden. La primera debe ser el origen y la última el destino.
                </p>

                {/* Lista de paradas */}
                {form.paradas.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-2">
                    {form.paradas.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <GripVertical size={13} className="text-gray-300 shrink-0" />
                        <span className={`text-xs flex-1 font-medium ${i === 0 ? 'text-brand-600' : i === form.paradas.length - 1 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {i === 0 ? '🟢 ' : i === form.paradas.length - 1 ? '🔴 ' : `${i}. `}{p}
                        </span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moverParada(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs px-1">↑</button>
                          <button type="button" onClick={() => moverParada(i, 1)} disabled={i === form.paradas.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs px-1">↓</button>
                          <button type="button" onClick={() => quitarParada(i)} className="text-gray-300 hover:text-red-500 ml-1"><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar parada */}
                <div className="flex gap-2">
                  <input
                    value={nuevaParada}
                    onChange={e => setNuevaParada(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarParada())}
                    placeholder="Nombre de la parada (ej: Baranoa)"
                    className={INPUT}
                  />
                  <button type="button" onClick={agregarParada} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition shrink-0">
                    <Plus size={15} />
                  </button>
                </div>
                {form.paradas.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    💡 Agrega primero "{form.origen || 'origen'}", luego las paradas intermedias, y por último "{form.destino || 'destino'}"
                  </p>
                )}
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
