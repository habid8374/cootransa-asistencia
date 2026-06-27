import { useEffect, useState } from 'react'
import { supabase, type Festivo } from '../../../lib/supabase'
import { FESTIVOS_CO } from '../../../lib/turnos'
import { Plus, Trash2, Calendar, Download } from 'lucide-react'

const INPUT = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500'

export default function Festivos() {
  const [festivos, setFestivos] = useState<Festivo[]>([])
  const [fecha, setFecha] = useState('')
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [precargando, setPrecargando] = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('festivos').select('*').order('fecha')
    setFestivos(data ?? [])
  }

  useEffect(() => { cargar() }, [])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fecha || !nombre.trim()) return
    setGuardando(true)
    await supabase.from('festivos').upsert({ fecha, nombre: nombre.trim() }, { onConflict: 'fecha' })
    setFecha(''); setNombre('')
    cargar(); setGuardando(false)
  }

  const eliminar = async (id: string) => {
    await supabase.from('festivos').delete().eq('id', id)
    cargar()
  }

  const precargar = async () => {
    setPrecargando(true)
    const existentes = new Set(festivos.map(f => f.fecha))
    const nuevos = FESTIVOS_CO.filter(f => !existentes.has(f.fecha))
    if (nuevos.length > 0) {
      await supabase.from('festivos').upsert(nuevos, { onConflict: 'fecha' })
    }
    cargar(); setPrecargando(false)
  }

  const porAnio = festivos.reduce<Record<string, Festivo[]>>((acc, f) => {
    const anio = f.fecha.slice(0, 4)
    ;(acc[anio] ??= []).push(f); return acc
  }, {})

  const fmtFecha = (iso: string) => new Date(iso + 'T12:00:00')
    .toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-4">
      {/* Precargar */}
      <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-blue-800">Festivos oficiales Colombia 2025–2026</p>
          <p className="text-xs text-blue-600 mt-0.5">Precarga los {FESTIVOS_CO.length} festivos oficiales de una vez</p>
        </div>
        <button
          onClick={precargar}
          disabled={precargando}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition disabled:opacity-60 shrink-0"
        >
          <Download size={13} /> {precargando ? 'Cargando...' : 'Precargar'}
        </button>
      </div>

      {/* Agregar manual */}
      <form onSubmit={agregar} className="flex gap-2 flex-wrap">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={INPUT} required />
        <input
          value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del festivo"
          className={`${INPUT} flex-1 min-w-40`} required
        />
        <button
          type="submit" disabled={guardando}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-60 shrink-0"
        >
          <Plus size={15} /> Agregar
        </button>
      </form>

      {/* Lista por año */}
      {Object.keys(porAnio).sort().map(anio => (
        <div key={anio}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{anio} · {porAnio[anio].length} festivos</p>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {porAnio[anio].map(f => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                <Calendar size={13} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{f.nombre}</p>
                  <p className="text-xs text-gray-400 capitalize">{fmtFecha(f.fecha)}</p>
                </div>
                <button
                  onClick={() => eliminar(f.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {festivos.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">No hay festivos cargados. Usa el botón "Precargar" para importar los festivos oficiales.</p>
      )}
    </div>
  )
}
