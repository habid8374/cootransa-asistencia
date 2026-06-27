import { useEffect, useState } from 'react'
import { supabase, type Viaje, type Ruta, type Bus } from '../../../lib/supabase'
import { Plus, X, Calendar, Clock, Users, ChevronDown } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
const SELECT = INPUT

const ESTADO_COLORS: Record<string, string> = {
  programado: 'text-blue-700 bg-blue-50',
  en_curso:   'text-green-700 bg-green-50',
  completado: 'text-gray-600 bg-gray-100',
  cancelado:  'text-red-600 bg-red-50',
}
const ESTADO_LABELS: Record<string, string> = {
  programado: 'Programado',
  en_curso:   'En curso',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

interface Form {
  ruta_id: string; bus_id: string; fecha: string
  hora_salida: string; precio: string; capacidad: string
}
const EMPTY: Form = { ruta_id: '', bus_id: '', fecha: '', hora_salida: '', precio: '', capacidad: '' }

export default function GestionViajes() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [modal, setModal] = useState<'nuevo' | Viaje | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [err, setErr] = useState('')
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0, 10))

  const cargar = async () => {
    const [{ data: vs }, { data: rs }, { data: bs }] = await Promise.all([
      supabase.from('viajes').select('*, ruta:rutas(*), bus:buses(*)').eq('fecha', filtroFecha).order('hora_salida'),
      supabase.from('rutas').select('*').eq('activa', true).order('origen'),
      supabase.from('buses').select('*').eq('activo', true).order('nombre'),
    ])
    setViajes((vs as Viaje[]) ?? [])
    setRutas(rs ?? [])
    setBuses(bs ?? [])
  }

  useEffect(() => { cargar() }, [filtroFecha])

  const abrirNuevo = () => {
    setErr(''); setForm({ ...EMPTY, fecha: filtroFecha })
    setModal('nuevo')
  }

  const onRutaChange = (rutaId: string) => {
    const ruta = rutas.find(r => r.id === rutaId)
    const bus = buses.find(b => b.id === form.bus_id)
    setForm(f => ({
      ...f,
      ruta_id: rutaId,
      precio: ruta ? String(ruta.precio_base) : f.precio,
      capacidad: bus ? String(bus.capacidad) : f.capacidad,
    }))
  }

  const onBusChange = (busId: string) => {
    const bus = buses.find(b => b.id === busId)
    setForm(f => ({ ...f, bus_id: busId, capacidad: bus ? String(bus.capacidad) : f.capacidad }))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ruta_id || !form.fecha || !form.hora_salida || !form.precio || !form.capacidad) {
      setErr('Completa todos los campos requeridos.'); return
    }
    setGuardando(true); setErr('')
    const payload = {
      ruta_id: form.ruta_id,
      bus_id: form.bus_id || null,
      fecha: form.fecha,
      hora_salida: form.hora_salida,
      precio: parseFloat(form.precio),
      capacidad_disponible: parseInt(form.capacidad),
    }
    const { error } = modal === 'nuevo'
      ? await supabase.from('viajes').insert(payload)
      : await supabase.from('viajes').update(payload).eq('id', (modal as Viaje).id)
    setGuardando(false)
    if (error) { setErr('Error: ' + error.message); return }
    cargar(); setModal(null)
  }

  const cambiarEstado = async (v: Viaje, estado: string) => {
    await supabase.from('viajes').update({ estado }).eq('id', v.id)
    cargar()
  }

  const eliminar = async (id: string) => {
    await supabase.from('viajes').delete().eq('id', id)
    cargar()
  }

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const totalAsientos = (v: Viaje) => {
    if (!v.bus) return v.capacidad_disponible
    return v.bus.capacidad
  }

  const vendidos = (v: Viaje) => totalAsientos(v) - v.capacidad_disponible

  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={abrirNuevo} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
          <Plus size={15} /> Programar viaje
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {viajes.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Sin viajes para esta fecha.</p>
        ) : viajes.map(v => (
          <div key={v.id} className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">
                    {v.ruta?.origen} → {v.ruta?.destino}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ESTADO_COLORS[v.estado]}`}>
                    {ESTADO_LABELS[v.estado]}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={11} /> {v.hora_salida.slice(0, 5)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={11} /> {vendidos(v)}/{totalAsientos(v)} vendidos
                  </span>
                  <span className="text-xs font-semibold text-brand-600">${v.precio.toLocaleString('es-CO')}</span>
                  {v.bus && <span className="text-xs text-gray-400">{v.bus.nombre || v.bus.placa}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="relative group">
                  <button className="text-xs font-medium text-gray-500 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition">
                    Estado <ChevronDown size={11} />
                  </button>
                  <div className="absolute right-0 top-7 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-10 hidden group-hover:block">
                    {Object.entries(ESTADO_LABELS).map(([k, label]) => (
                      <button key={k} onClick={() => cambiarEstado(v, k)}
                        className={`w-full text-left text-xs px-3 py-2 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${v.estado === k ? 'font-semibold text-brand-600' : 'text-gray-700'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => eliminar(v.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Barra de ocupación */}
            <div className="mt-2.5">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (vendidos(v) / totalAsientos(v)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Programar viaje</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="p-5 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ruta *</label>
                <select value={form.ruta_id} onChange={e => onRutaChange(e.target.value)} required className={SELECT}>
                  <option value="">Selecciona una ruta</option>
                  {rutas.map(r => <option key={r.id} value={r.id}>{r.origen} → {r.destino}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vehículo</label>
                <select value={form.bus_id} onChange={e => onBusChange(e.target.value)} className={SELECT}>
                  <option value="">Sin asignar</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.nombre || b.placa} ({b.capacidad} pax)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                  <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora de salida *</label>
                  <input type="time" value={form.hora_salida} onChange={e => set('hora_salida', e.target.value)} required className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Precio (COP) *</label>
                  <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} required className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Capacidad *</label>
                  <input type="number" value={form.capacidad} onChange={e => set('capacidad', e.target.value)} required className={INPUT} />
                </div>
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button type="submit" disabled={guardando} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar viaje'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
