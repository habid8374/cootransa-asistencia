import { useState } from 'react'
import { MapPin, Bus, CalendarDays, BarChart3, ChevronRight, ExternalLink } from 'lucide-react'
import GestionRutas from './tiquetes/GestionRutas'
import GestionBuses from './tiquetes/GestionBuses'
import GestionViajes from './tiquetes/GestionViajes'
import VentasTiquetes from './tiquetes/VentasTiquetes'

type Sub = 'inicio' | 'rutas' | 'buses' | 'viajes' | 'ventas'

const TABS: { key: Sub; label: string; icon: React.ReactNode }[] = [
  { key: 'rutas',  label: 'Rutas y tarifas', icon: <MapPin size={14} /> },
  { key: 'buses',  label: 'Flota',           icon: <Bus size={14} /> },
  { key: 'viajes', label: 'Viajes del día',  icon: <CalendarDays size={14} /> },
  { key: 'ventas', label: 'Ventas',          icon: <BarChart3 size={14} /> },
]

const PASOS = [
  { num: '1', label: 'Rutas y tarifas', desc: 'Crea las rutas con precio base', tab: 'rutas' as Sub, color: 'bg-blue-500' },
  { num: '2', label: 'Flota',           desc: 'Registra los buses con capacidad', tab: 'buses' as Sub, color: 'bg-purple-500' },
  { num: '3', label: 'Viajes del día',  desc: 'Programa las salidas de hoy', tab: 'viajes' as Sub, color: 'bg-brand-500' },
  { num: '4', label: 'Ventas',          desc: 'Monitorea lo vendido', tab: 'ventas' as Sub, color: 'bg-green-500' },
]

export default function GestionTiquetes() {
  const [sub, setSub] = useState<Sub>('inicio')

  return (
    <div className="space-y-4">

      {/* Banner URL pública */}
      <div className="bg-brand-600 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-white text-sm font-bold">App de pasajeros</p>
          <p className="text-brand-200 text-xs mt-0.5">Comparte este link para que compren sus tiquetes</p>
        </div>
        <a
          href="/tiquetes"
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-white px-3 py-2 rounded-lg hover:bg-brand-50 transition shrink-0"
        >
          <ExternalLink size={13} /> Abrir
        </a>
      </div>

      {sub === 'inicio' ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">¿Por dónde empezar?</p>
          <p className="text-xs text-gray-400">Sigue este orden la primera vez:</p>
          {PASOS.map((p) => (
            <button
              key={p.tab}
              onClick={() => setSub(p.tab)}
              className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm transition text-left"
            >
              <div className={`${p.color} text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>
                {p.num}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
          <p className="text-[11px] text-gray-400 text-center pt-1">
            Una vez configurado, los pasajeros compran solos desde su celular.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSub('inicio')}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              ← Inicio
            </button>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setSub(t.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
                    sub === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {sub === 'rutas'  && <GestionRutas />}
          {sub === 'buses'  && <GestionBuses />}
          {sub === 'viajes' && <GestionViajes />}
          {sub === 'ventas' && <VentasTiquetes />}
        </>
      )}
    </div>
  )
}
