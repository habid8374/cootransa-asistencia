import { useEffect, useState } from 'react'
import { supabase, type Ruta, type TarifaSegmento } from '../../../lib/supabase'
import { DollarSign } from 'lucide-react'

const INPUT = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-32'

export default function GestionTarifas() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [rutaId, setRutaId] = useState('')
  const [tarifas, setTarifas] = useState<TarifaSegmento[]>([])
  const [precios, setPrecios] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('rutas').select('*').order('origen').then(({ data }) => {
      setRutas((data ?? []).filter((r: Ruta) => r.paradas && r.paradas.length >= 2))
    })
  }, [])

  const ruta = rutas.find(r => r.id === rutaId)

  useEffect(() => {
    if (!rutaId) { setTarifas([]); return }
    supabase.from('tarifas_segmento').select('*').eq('ruta_id', rutaId)
      .then(({ data }) => setTarifas(data ?? []))
  }, [rutaId])

  const segmentos = ruta?.paradas
    ? ruta.paradas.flatMap((o, i) =>
        ruta.paradas!.slice(i + 1).map(d => ({ origen: o, destino: d }))
      )
    : []

  const tarifaActual = (o: string, d: string) =>
    tarifas.find(t => t.origen === o && t.destino === d)

  const key = (o: string, d: string) => `${o}|${d}`

  const guardar = async (origen: string, destino: string) => {
    const k = key(origen, destino)
    const precio = parseFloat(precios[k] ?? '')
    if (isNaN(precio) || precio <= 0) return
    setGuardando(k)
    await supabase.from('tarifas_segmento').upsert(
      { ruta_id: rutaId, origen, destino, precio },
      { onConflict: 'ruta_id,origen,destino' }
    )
    const { data } = await supabase.from('tarifas_segmento').select('*').eq('ruta_id', rutaId)
    setTarifas(data ?? [])
    setPrecios(p => { const n = { ...p }; delete n[k]; return n })
    setGuardando(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Línea con paradas</label>
        <select
          value={rutaId}
          onChange={e => setRutaId(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">— Seleccionar línea —</option>
          {rutas.map(r => (
            <option key={r.id} value={r.id}>{r.origen} → {r.destino}</option>
          ))}
        </select>
        {rutas.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Primero crea líneas con paradas en la pestaña Rutas.
          </p>
        )}
      </div>

      {ruta && segmentos.length === 0 && (
        <p className="text-sm text-gray-400">Esta línea no tiene paradas configuradas.</p>
      )}

      {segmentos.length > 0 && (
        <>
          <p className="text-xs text-gray-400">
            Configura el precio de cada tramo. Si no hay tarifa para un tramo, se usa el precio base del viaje.
          </p>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {segmentos.map(({ origen, destino }) => {
              const k = key(origen, destino)
              const actual = tarifaActual(origen, destino)
              return (
                <div key={k} className="flex items-center gap-3 px-4 py-3">
                  <DollarSign size={13} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{origen} → {destino}</p>
                    {actual && (
                      <p className="text-xs text-gray-400">${actual.precio.toLocaleString('es-CO')} COP</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={actual ? String(actual.precio) : 'Precio'}
                      value={precios[k] ?? ''}
                      onChange={e => setPrecios(p => ({ ...p, [k]: e.target.value }))}
                      className={INPUT}
                    />
                    <button
                      onClick={() => guardar(origen, destino)}
                      disabled={guardando === k || !precios[k]}
                      className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                    >
                      {guardando === k ? '...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
