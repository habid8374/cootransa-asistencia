import { useEffect, useState } from 'react'
import { supabase, type TipoEmpleado } from '../../../lib/supabase'
import { Plus, Trash2, Users } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export default function TiposEmpleado() {
  const [tipos, setTipos] = useState<TipoEmpleado[]>([])
  const [nuevo, setNuevo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data } = await supabase.from('tipos_empleado').select('*').order('nombre')
    setTipos(data ?? [])
  }

  useEffect(() => { cargar() }, [])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevo.trim()) return
    setGuardando(true); setError('')
    const { error: err } = await supabase.from('tipos_empleado').insert({ nombre: nuevo.trim() })
    if (err) setError('Ya existe ese tipo o hubo un error.')
    else { setNuevo(''); cargar() }
    setGuardando(false)
  }

  const eliminar = async (id: string) => {
    await supabase.from('tipos_empleado').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={agregar} className="flex gap-2">
        <input
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          placeholder="Nuevo tipo (ej: Operativo, Conductor, Administrativo)"
          className={INPUT}
        />
        <button
          type="submit"
          disabled={guardando || !nuevo.trim()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-60 shrink-0"
        >
          <Plus size={15} /> Agregar
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {tipos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">Aún no hay tipos de empleado.</p>
        ) : tipos.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <Users size={15} className="text-brand-500 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-800">{t.nombre}</span>
            <button
              onClick={() => eliminar(t.id)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
              title="Eliminar tipo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
