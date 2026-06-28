import { useState } from 'react'
import { MapPin, Bus, CalendarDays, BarChart3, DollarSign } from 'lucide-react'
import GestionRutas from './tiquetes/GestionRutas'
import GestionTarifas from './tiquetes/GestionTarifas'
import GestionBuses from './tiquetes/GestionBuses'
import GestionViajes from './tiquetes/GestionViajes'
import VentasTiquetes from './tiquetes/VentasTiquetes'

type Sub = 'rutas' | 'tarifas' | 'buses' | 'viajes' | 'ventas'

const TABS: { key: Sub; label: string; icon: React.ReactNode }[] = [
  { key: 'rutas',   label: 'Líneas',   icon: <MapPin size={14} /> },
  { key: 'tarifas', label: 'Tarifas',  icon: <DollarSign size={14} /> },
  { key: 'buses',   label: 'Flota',    icon: <Bus size={14} /> },
  { key: 'viajes',  label: 'Viajes',   icon: <CalendarDays size={14} /> },
  { key: 'ventas',  label: 'Ventas',   icon: <BarChart3 size={14} /> },
]

export default function GestionTiquetes() {
  const [sub, setSub] = useState<Sub>('rutas')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
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

      {sub === 'rutas'   && <GestionRutas />}
      {sub === 'tarifas' && <GestionTarifas />}
      {sub === 'buses'   && <GestionBuses />}
      {sub === 'viajes'  && <GestionViajes />}
      {sub === 'ventas'  && <VentasTiquetes />}
    </div>
  )
}
