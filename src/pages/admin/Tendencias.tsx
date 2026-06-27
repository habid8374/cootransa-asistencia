import { useEffect, useState } from 'react'
import { supabase, type Empleado } from '../../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingUp, AlertTriangle } from 'lucide-react'

function minsLate(ts: string, horaEsp: string): number {
  const [hh, mm] = horaEsp.split(':').map(Number)
  const esp = new Date(ts); esp.setHours(hh, mm, 0, 0)
  return Math.max(0, Math.floor((new Date(ts).getTime() - esp.getTime()) / 60000))
}

interface DiaAsistencia {
  dia: string
  pct: number
  presentes: number
  total: number
}

interface TardanzaEmp {
  nombre: string
  mins: number
  veces: number
}

export default function Tendencias() {
  const [asistencia, setAsistencia] = useState<DiaAsistencia[]>([])
  const [tardanzas, setTardanzas] = useState<TardanzaEmp[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const hoy = new Date()
      const hace14 = new Date(hoy); hace14.setDate(hace14.getDate() - 13)
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)
      const inicioMesISO = inicioMes.toISOString().slice(0, 10)
      const finMesISO = finMes.toISOString().slice(0, 10)

      const [{ data: emps }, { data: marcas14 }, { data: marcasMes }, { data: permisosMes }] = await Promise.all([
        supabase.from('empleados').select('id, nombre, hora_entrada').eq('activo', true),
        supabase.from('marcaciones').select('empleado_id, timestamp')
          .gte('timestamp', hace14.toISOString()).lte('timestamp', hoy.toISOString()),
        supabase.from('marcaciones').select('empleado_id, timestamp, tipo')
          .gte('timestamp', inicioMes.toISOString()).lte('timestamp', finMes.toISOString()),
        supabase.from('permisos').select('empleado_id, fecha')
          .gte('fecha', inicioMesISO).lte('fecha', finMesISO),
      ])

      const empleados = (emps ?? []) as Empleado[]
      const total = empleados.length

      // Asistencia de los últimos 14 días
      const dias14: DiaAsistencia[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(hoy); d.setDate(d.getDate() - i)
        const iso = d.toISOString().slice(0, 10)
        const presentes = new Set(
          (marcas14 ?? []).filter(m => m.timestamp.slice(0, 10) === iso).map(m => m.empleado_id)
        ).size
        dias14.push({
          dia: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
          pct: total > 0 ? Math.round((presentes / total) * 100) : 0,
          presentes,
          total,
        })
      }
      setAsistencia(dias14)

      // Tardanzas por empleado este mes
      const result: TardanzaEmp[] = []
      for (const emp of empleados) {
        if (!emp.hora_entrada) continue
        const entradasEmp = (marcasMes ?? []).filter(m => m.empleado_id === emp.id && m.tipo === 'entrada')
        let totalMins = 0, veces = 0
        for (const m of entradasEmp) {
          const fecha = m.timestamp.slice(0, 10)
          const tienePermiso = (permisosMes ?? []).some(p => p.empleado_id === emp.id && p.fecha === fecha)
          if (tienePermiso) continue
          const mins = minsLate(m.timestamp, emp.hora_entrada!)
          if (mins > 0) { totalMins += mins; veces++ }
        }
        if (totalMins > 0) result.push({ nombre: emp.nombre.split(' ')[0], mins: totalMins, veces })
      }
      result.sort((a, b) => b.mins - a.mins)
      setTardanzas(result.slice(0, 10))

      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) return <div className="py-16 text-center text-sm text-gray-400">Cargando tendencias...</div>

  const labelMes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Asistencia últimos 14 días */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-brand-600" />
          <h3 className="text-sm font-bold text-gray-900">Asistencia diaria – últimos 14 días</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={asistencia} margin={{ top: 5, right: 10, left: -28, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, _name, props) => [`${value}% (${props.payload.presentes}/${props.payload.total})`, 'Asistencia']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {asistencia.map((entry, i) => (
                <Cell key={i} fill={entry.pct >= 80 ? '#16a34a' : entry.pct >= 50 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-end text-[10px] text-gray-400 font-semibold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-600 inline-block" /> ≥ 80%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 50–79%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> &lt; 50%</span>
        </div>
      </div>

      {/* Tardanzas por empleado este mes */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-red-500" />
          <h3 className="text-sm font-bold text-gray-900 capitalize">
            Minutos de tardanza por empleado – {labelMes}
          </h3>
        </div>
        {tardanzas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin tardanzas registradas este mes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, tardanzas.length * 44)}>
            <BarChart layout="vertical" data={tardanzas} margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" tickFormatter={v => `${v}m`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#374151' }} width={72} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, _name, props) => [`${value} min (${props.payload.veces} vez${props.payload.veces > 1 ? 'ces' : ''})`, 'Tardanza acumulada']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="mins" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
