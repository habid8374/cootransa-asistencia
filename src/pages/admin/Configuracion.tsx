import { useState } from 'react'
import TiposEmpleado from './config/TiposEmpleado'
import GestionTurnos from './config/GestionTurnos'
import Festivos from './config/Festivos'
import AsignacionMasiva from './config/AsignacionMasiva'
import { Users, Clock, Calendar, TableProperties } from 'lucide-react'

type SubTab = 'tipos' | 'turnos' | 'festivos' | 'asignacion'

const TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'tipos',     label: 'Tipos de empleado', icon: <Users size={14} /> },
  { key: 'turnos',    label: 'Turnos',             icon: <Clock size={14} /> },
  { key: 'festivos',  label: 'Festivos',           icon: <Calendar size={14} /> },
  { key: 'asignacion', label: 'Asignación masiva', icon: <TableProperties size={14} /> },
]

export default function Configuracion() {
  const [tab, setTab] = useState<SubTab>('turnos')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'tipos'      && <TiposEmpleado />}
      {tab === 'turnos'     && <GestionTurnos />}
      {tab === 'festivos'   && <Festivos />}
      {tab === 'asignacion' && <AsignacionMasiva />}
    </div>
  )
}
