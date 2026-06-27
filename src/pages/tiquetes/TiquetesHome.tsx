import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, Ticket, ChevronRight } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white'

export default function TiquetesHome() {
  const navigate = useNavigate()
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [cedula, setCedula] = useState('')
  const [showMisTiquetes, setShowMisTiquetes] = useState(false)

  const buscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origen.trim() || !destino.trim() || !fecha) return
    navigate(`/tiquetes/viajes?origen=${encodeURIComponent(origen.trim())}&destino=${encodeURIComponent(destino.trim())}&fecha=${fecha}`)
  }

  const verMisTiquetes = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cedula.trim()) return
    navigate(`/tiquetes/mis-tiquetes?cedula=${encodeURIComponent(cedula.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-800">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-lg mx-auto">
        <div>
          <p className="text-white font-bold text-lg">COOTRANSA</p>
          <p className="text-brand-200 text-xs">Compra tu tiquete</p>
        </div>
        <button
          onClick={() => setShowMisTiquetes(v => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition"
        >
          <Ticket size={14} /> Mis tiquetes
        </button>
      </header>

      {/* Search card */}
      <div className="px-4 max-w-lg mx-auto mt-2">
        {!showMisTiquetes ? (
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <h1 className="text-base font-bold text-gray-900 mb-4">¿A dónde vas?</h1>
            <form onSubmit={buscar} className="space-y-3">
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  value={origen}
                  onChange={e => setOrigen(e.target.value)}
                  placeholder="Ciudad de origen"
                  required
                  className={INPUT + ' pl-9'}
                />
              </div>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-brand-500" />
                <input
                  value={destino}
                  onChange={e => setDestino(e.target.value)}
                  placeholder="Ciudad de destino"
                  required
                  className={INPUT + ' pl-9'}
                />
              </div>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                required
                className={INPUT}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center justify-center gap-2 transition"
              >
                <Search size={16} /> Buscar disponibilidad
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <h1 className="text-base font-bold text-gray-900 mb-1">Consultar mis tiquetes</h1>
            <p className="text-xs text-gray-500 mb-4">Ingresa tu número de cédula para ver tus compras</p>
            <form onSubmit={verMisTiquetes} className="space-y-3">
              <input
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                placeholder="Número de cédula"
                required
                className={INPUT}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition"
              >
                Ver mis tiquetes
              </button>
            </form>
            <button onClick={() => setShowMisTiquetes(false)} className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 transition">
              ← Volver a buscar
            </button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="px-4 max-w-lg mx-auto mt-6 pb-8">
        <p className="text-brand-200 text-xs font-semibold uppercase tracking-wider mb-3">Métodos de pago aceptados</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '💜', label: 'Nequi' },
            { icon: '🔴', label: 'Daviplata' },
            { icon: '💳', label: 'Tarjeta' },
            { icon: '🏷️', label: 'En taquilla' },
          ].map(m => (
            <div key={m.label} className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-lg">{m.icon}</span>
              <span className="text-white text-sm font-medium">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">¿Eres conductor?</p>
            <p className="text-brand-200 text-xs">Valida tiquetes de pasajeros</p>
          </div>
          <a href="/conductor" className="flex items-center gap-1 text-white text-sm font-semibold bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
            Validar <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
