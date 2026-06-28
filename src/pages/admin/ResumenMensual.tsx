import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion, type Permiso } from '../../lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FilaEmpleado {
  empleado: Empleado
  diasTrabajados: number
  horasMs: number
  tardanzas: number
  minutosTardanzaTotal: number
  diasAnticipados: number
  diasExtra: number
  minutosExtraTotal: number
  diasPermiso: number
  diasSinMarcar: number
}

function minsLate(ts: string, horaEsp: string): number {
  const [hh, mm] = horaEsp.split(':').map(Number)
  const esp = new Date(ts); esp.setHours(hh, mm, 0, 0)
  return Math.max(0, Math.floor((new Date(ts).getTime() - esp.getTime()) / 60000))
}
function minsEarly(ts: string, horaEsp: string): number {
  const [hh, mm] = horaEsp.split(':').map(Number)
  const esp = new Date(ts); esp.setHours(hh, mm, 0, 0)
  return Math.max(0, Math.floor((esp.getTime() - new Date(ts).getTime()) / 60000))
}

export default function ResumenMensual() {
  const ahora = new Date()
  const [mes, setMes] = useState(ahora.getMonth())
  const [año, setAño] = useState(ahora.getFullYear())
  const [filas, setFilas] = useState<FilaEmpleado[]>([])
  const [cargando, setCargando] = useState(true)
  const [diasHabiles, setDiasHabiles] = useState(0)

  const cargar = async () => {
    setCargando(true)
    const inicio = new Date(año, mes, 1)
    const fin = new Date(año, mes + 1, 0, 23, 59, 59)
    const inicioISO = inicio.toISOString().slice(0, 10)
    const finISO = fin.toISOString().slice(0, 10)

    let dias = 0
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) dias++
    }
    setDiasHabiles(dias)

    const [{ data: empleados }, { data: marcaciones }, { data: permisosMes }] = await Promise.all([
      supabase.from('empleados').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcaciones').select('*')
        .gte('timestamp', inicio.toISOString()).lte('timestamp', fin.toISOString())
        .order('timestamp', { ascending: true }),
      supabase.from('permisos').select('*').gte('fecha', inicioISO).lte('fecha', finISO),
    ])

    const emps = (empleados ?? []) as Empleado[]
    const marcas = (marcaciones ?? []) as Marcacion[]
    const permisos = (permisosMes ?? []) as Permiso[]

    const result: FilaEmpleado[] = emps.map(emp => {
      const propias = marcas.filter(m => m.empleado_id === emp.id)
      const permisosEmp = permisos.filter(p => p.empleado_id === emp.id)

      const porDia = propias.reduce<Record<string, Marcacion[]>>((acc, m) => {
        const dia = new Date(m.timestamp).toISOString().slice(0, 10)
        ;(acc[dia] ??= []).push(m); return acc
      }, {})

      const diasTrabajados = Object.keys(porDia).length
      let horasMs = 0, tardanzas = 0, minutosTardanzaTotal = 0, diasAnticipados = 0, diasExtra = 0, minutosExtraTotal = 0

      for (const [dia, lista] of Object.entries(porDia)) {
        const tienePermiso = permisosEmp.some(p => p.fecha === dia)
        const ord = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        let entrada: number | null = null
        let tardanzaDia = false
        let anticipadoDia = false
        let extraMinsDia = 0

        for (const m of ord) {
          if (m.tipo === 'entrada') {
            entrada = new Date(m.timestamp).getTime()
            if (!tienePermiso && emp.hora_entrada) {
              const mins = minsLate(m.timestamp, emp.hora_entrada)
              if (mins > 0) { tardanzaDia = true; minutosTardanzaTotal += mins }
            }
          } else if (m.tipo === 'salida') {
            if (entrada != null) { horasMs += new Date(m.timestamp).getTime() - entrada; entrada = null }
            if (!tienePermiso && emp.hora_salida) {
              if (minsEarly(m.timestamp, emp.hora_salida) > 0) anticipadoDia = true
              const extra = minsLate(m.timestamp, emp.hora_salida)
              if (extra > 0) extraMinsDia = Math.max(extraMinsDia, extra)
            }
          }
        }
        if (tardanzaDia) tardanzas++
        if (anticipadoDia) diasAnticipados++
        if (extraMinsDia > 0) { diasExtra++; minutosExtraTotal += extraMinsDia }
      }

      const diasPermiso = permisosEmp.length
      const diasAusenteReal = Math.max(0, dias - diasTrabajados - diasPermiso)

      return { empleado: emp, diasTrabajados, horasMs, tardanzas, minutosTardanzaTotal, diasAnticipados, diasExtra, minutosExtraTotal, diasPermiso, diasSinMarcar: diasAusenteReal }
    })

    setFilas(result)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [mes, año])

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAño(a => a - 1) } else setMes(m => m - 1)
  }
  const mesSiguiente = () => {
    const now = new Date()
    if (año > now.getFullYear() || (año === now.getFullYear() && mes >= now.getMonth())) return
    if (mes === 11) { setMes(0); setAño(a => a + 1) } else setMes(m => m + 1)
  }

  const nombreMes = new Date(año, mes, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const fmtHoras = (ms: number) => {
    const h = Math.floor(ms / 3.6e6), m = Math.round((ms % 3.6e6) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <button onClick={mesAnterior} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronLeft size={18} /></button>
          <span className="text-sm font-semibold text-gray-900 capitalize w-44 text-center">{nombreMes}</span>
          <button onClick={mesSiguiente} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronRight size={18} /></button>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {diasHabiles} días hábiles · Lun–Sáb
        </span>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Días trab.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Horas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tard.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Min. tarde</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">S. antic.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">H. Extra</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Permisos</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sin marcar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filas.map(f => (
                  <tr key={f.empleado.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {f.empleado.foto_url ? (
                          <img src={f.empleado.foto_url} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {f.empleado.nombre.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 whitespace-nowrap">{f.empleado.nombre}</p>
                          {f.empleado.hora_entrada && f.empleado.hora_salida && (
                            <p className="text-xs text-gray-400">{f.empleado.hora_entrada} – {f.empleado.hora_salida}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${f.diasTrabajados === 0 ? 'text-red-500' : 'text-gray-900'}`}>{f.diasTrabajados}</span>
                      <span className="text-gray-400">/{diasHabiles}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                      {f.horasMs > 0 ? fmtHoras(f.horasMs) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.tardanzas > 0
                        ? <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{f.tardanzas}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.minutosTardanzaTotal > 0
                        ? <span className="text-xs font-semibold text-red-600">{f.minutosTardanzaTotal}m</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.diasAnticipados > 0
                        ? <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{f.diasAnticipados}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {f.minutosExtraTotal > 0
                        ? <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{f.minutosExtraTotal}m</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.diasPermiso > 0
                        ? <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{f.diasPermiso}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.diasSinMarcar > 0
                        ? <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{f.diasSinMarcar}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
