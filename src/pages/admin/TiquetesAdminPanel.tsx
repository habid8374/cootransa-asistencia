import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import GestionRutas from './tiquetes/GestionRutas'
import GestionTarifas from './tiquetes/GestionTarifas'
import GestionBuses from './tiquetes/GestionBuses'
import GestionViajes from './tiquetes/GestionViajes'
import VentasTiquetes from './tiquetes/VentasTiquetes'
import {
  MapPin, Bus, CalendarDays, BarChart3, DollarSign,
  LogOut, Ticket, Menu, ExternalLink,
} from 'lucide-react'

type Tab = 'rutas' | 'tarifas' | 'buses' | 'viajes' | 'ventas'

const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'rutas',   label: 'Líneas',  icon: <MapPin size={18} /> },
  { key: 'tarifas', label: 'Tarifas', icon: <DollarSign size={18} /> },
  { key: 'buses',   label: 'Flota',   icon: <Bus size={18} /> },
  { key: 'viajes',  label: 'Viajes',  icon: <CalendarDays size={18} /> },
  { key: 'ventas',  label: 'Ventas',  icon: <BarChart3 size={18} /> },
]

export default function TiquetesAdminPanel() {
  const [tab, setTab] = useState<Tab>('rutas')
  const [open, setOpen] = useState(true)

  const titulo = NAV.find(n => n.key === tab)?.label ?? ''

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${open ? 'w-60' : 'w-16'} bg-gray-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out`}>

        {/* Marca + toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/5 flex-shrink-0">
          {open && (
            <div className="overflow-hidden mr-2">
              <p className="text-white font-bold text-sm leading-tight truncate">COOTRANSA</p>
              <p className="text-gray-500 text-[9px] uppercase tracking-widest">Tiquetes</p>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0 ml-auto"
            title={open ? 'Colapsar menú' : 'Expandir menú'}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              title={!open ? n.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === n.key
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex-shrink-0">{n.icon}</span>
              {open && <span className="truncate">{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* Pie del sidebar */}
        <div className="px-2 pb-3 pt-2 border-t border-white/5 space-y-0.5 flex-shrink-0">
          <a
            href="/tiquetes"
            target="_blank"
            title={!open ? 'Portal de tiquetes' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Portal público</span>}
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            title={!open ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span className="truncate">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Barra superior */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-6 gap-3 flex-shrink-0">
          <Ticket size={16} className="text-brand-600" />
          <h1 className="text-sm font-semibold text-gray-800">{titulo}</h1>
        </header>

        {/* Área scrolleable */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {tab === 'rutas'   && <GestionRutas />}
            {tab === 'tarifas' && <GestionTarifas />}
            {tab === 'buses'   && <GestionBuses />}
            {tab === 'viajes'  && <GestionViajes />}
            {tab === 'ventas'  && <VentasTiquetes />}
          </div>
        </main>
      </div>
    </div>
  )
}
