import { useEffect, useState } from 'react'
import { supabase, type Empleado, type Marcacion } from '../../lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FilaEmpleado {
  empleado: Empleado
  diasTrabajados: number
  horasMs: number
  tardanzas: number
  diasSinMarcar: number
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

    // Count working days (Mon–Sat; Sunday = 0)
    let dias = 0
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) dias++
    }
    setDiasHabiles(dias)

    const [{ data: empleados }, { data: marcaciones }] = await Promise.all([
      supabase.from('empleados').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcaciones').select('*')
        .gte('timestamp', inicio.toISOString())
        .lte('timestamp', fin.toISOString())
        .order('timestamp', { ascending: true }),
    ])

    const emps = (empleados ?? []) as Empleado[]
    const marcas = (marcaciones ?? []) as Marcacion[]

    const result: FilaEmpleado[] = emps.map(emp => {
      const propias = marcas.filter(m => m.empleado_id === emp.id)

      const porDia = propias.reduce<Record<string, Marcacion[]>>((acc, m) => {
        const dia = new Date(m.timestamp).toISOString().slice(0, 10)
        ;(acc[dia] ??= []).push(m)
        return acc
      }, {})

      const diasTrabajados = Object.keys(porDia).length
      let horasMs = 0, tardanzas = 0

      for (const lista of Object.values(porDia)) {
        const ord = [...lista].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        let entrada: number | null = null
        for (const m of ord) {
          if (m.tipo === 'entrada') {
            entrada = new Date(m.timestamp).getTime()
            if (emp.hora_entrada) {
              const [hh, mm] = emp.hora_entrada.split(':').map(Number)
              const esperada = new Date(m.timestamp); esperada.setHours(hh, mm, 0, 0)
              if (new Date(m.timestamp) > esperada) tardanzas++
            }
          } else if (m.tipo === 'salida' && entrada != null) {
            horasMs += new Date(m.timestamp).getTime() - entrada
            entrada = null
          }
        }
      }

      return { empleado: emp, diasTrabajados, horasMs, tardanzas, diasSinMarcar: Math.max(0, dias - diasTrabajados) }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={mesAnterior} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-900 capitalize w-44 text-center">{nombreMes}</span>
          <button onClick={mesSiguiente} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronRight size={18} />
          </button>
        </div>
        <span className="text-xs text-gray-400">{diasHabiles} días hábiles (Lun–Sáb)</span>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
      ) : filas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-12 text-center text-sm text-gray-400">
          No hay empleados activos.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Empleado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Días trabajados</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Horas totales</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Tardanzas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Días sin marcar</th>
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
                          <p className="font-semibold text-gray-900">{f.empleado.nombre}</p>
                          {f.empleado.hora_entrada && (
                            <p className="text-xs text-gray-400">Entrada: {f.empleado.hora_entrada}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${f.diasTrabajados === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                        {f.diasTrabajados}
                      </span>
                      <span className="text-gray-400">/{diasHabiles}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {f.horasMs > 0 ? fmtHoras(f.horasMs) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.tardanzas > 0 ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{f.tardanzas}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.diasSinMarcar > 0 ? (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{f.diasSinMarcar}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
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
