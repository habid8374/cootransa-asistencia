import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion } from '../../lib/supabase'
import { Users, LogIn, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'

interface EmpleadoEstado {
  empleado: Empleado
  estado: 'presente' | 'salio' | 'ausente'
  primeraEntrada?: string
  ultimaMarca?: Marcacion
  esTardanza: boolean
}

function Card({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className={`${bg} rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3`}>
      <div className={`${color} shrink-0`}>{icon}</div>
      <div>
        <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [datos, setDatos] = useState<EmpleadoEstado[]>([])
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())

  const cargar = async () => {
    setCargando(true)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const [{ data: empleados }, { data: marcaciones }] = await Promise.all([
      supabase.from('empleados').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcaciones').select('*')
        .gte('timestamp', hoy.toISOString())
        .order('timestamp', { ascending: true }),
    ])

    const emps = (empleados ?? []) as Empleado[]
    const marcas = (marcaciones ?? []) as Marcacion[]

    const result: EmpleadoEstado[] = emps.map(emp => {
      const propias = marcas.filter(m => m.empleado_id === emp.id)
      if (propias.length === 0) return { empleado: emp, estado: 'ausente', esTardanza: false }

      const primeraEntrada = propias.find(m => m.tipo === 'entrada')
      const ultima = propias[propias.length - 1]

      let esTardanza = false
      if (primeraEntrada && emp.hora_entrada) {
        const entradaDate = new Date(primeraEntrada.timestamp)
        const [hh, mm] = emp.hora_entrada.split(':').map(Number)
        const esperada = new Date(entradaDate)
        esperada.setHours(hh, mm, 0, 0)
        esTardanza = entradaDate > esperada
      }

      return {
        empleado: emp,
        estado: ultima.tipo === 'entrada' ? 'presente' : 'salio',
        primeraEntrada: primeraEntrada?.timestamp,
        ultimaMarca: ultima,
        esTardanza,
      }
    })

    setDatos(result)
    setUltimaActualizacion(new Date())
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => {
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [])

  const presentes = datos.filter(d => d.estado === 'presente')
  const salieron = datos.filter(d => d.estado === 'salio')
  const ausentes = datos.filter(d => d.estado === 'ausente')
  const tardanzas = datos.filter(d => d.esTardanza)

  const fmtHora = (ts: string) => new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Presentes" value={presentes.length} color="text-brand-700" bg="bg-brand-50" icon={<LogIn size={18} />} />
        <Card label="Salieron" value={salieron.length} color="text-orange-600" bg="bg-orange-50" icon={<LogOut size={18} />} />
        <Card label="Ausentes" value={ausentes.length} color="text-gray-500" bg="bg-gray-100" icon={<Users size={18} />} />
        <Card label="Tardanzas" value={tardanzas.length} color="text-red-600" bg="bg-red-50" icon={<AlertTriangle size={18} />} />
      </div>

      <div className="flex justify-between items-center gap-2">
        <p className="text-[11px] sm:text-xs text-gray-400 truncate min-w-0">
          Act. {ultimaActualizacion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <button
          onClick={cargar}
          disabled={cargando}
          className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-60 shrink-0"
        >
          <RefreshCw size={12} className={cargando ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {cargando && datos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">Cargando...</p>
        ) : datos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">No hay empleados activos.</p>
        ) : datos.map(({ empleado, estado, primeraEntrada, ultimaMarca, esTardanza }) => (
          <div key={empleado.id} className="flex items-center gap-2.5 px-3 sm:px-5 py-3">
            {/* Avatar con punto de estado */}
            <div className="relative shrink-0">
              {empleado.foto_url ? (
                <img src={empleado.foto_url} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" alt={empleado.nombre} />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                  {empleado.nombre.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${
                estado === 'presente' ? 'bg-brand-500' : estado === 'salio' ? 'bg-orange-400' : 'bg-gray-300'
              }`} />
            </div>

            {/* Nombre + subtítulo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{empleado.nombre}</p>
                {esTardanza && (
                  <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                    <AlertTriangle size={9} /> Tarde
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {estado === 'ausente'
                  ? 'Sin marcaciones hoy'
                  : `${estado === 'presente' ? 'Presente' : 'Salió'} · ${fmtHora(ultimaMarca!.timestamp)}`}
                {primeraEntrada && esTardanza && empleado.hora_entrada && (
                  <span className="text-red-400"> · esp. {empleado.hora_entrada}</span>
                )}
              </p>
            </div>

            {/* Badge de estado — oculto en móvil, el punto del avatar ya lo indica */}
            <span className={`hidden sm:inline-flex shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              estado === 'presente' ? 'bg-brand-50 text-brand-700'
              : estado === 'salio' ? 'bg-orange-50 text-orange-600'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {estado === 'presente' ? 'Presente' : estado === 'salio' ? 'Salió' : 'Ausente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
