import { useEffect, useRef, useState } from 'react'
import { supabase, type Empleado } from '../lib/supabase'
import { loadModels, getDescriptor, matchDescriptor } from '../lib/face'
import { useCamera } from '../hooks/useCamera'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'escaneando' }
  | { tipo: 'exito'; empleado: Empleado; marca: 'entrada' | 'salida'; hora: string }
  | { tipo: 'no_reconocido' }

export default function Kiosco() {
  const { videoRef, ready, error } = useCamera()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [reloj, setReloj] = useState(new Date())
  const lockRef = useRef(false)

  // Reloj en vivo
  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Carga modelos + empleados
  useEffect(() => {
    async function init() {
      await loadModels()
      const { data } = await supabase.from('empleados').select('*').eq('activo', true)
      setEmpleados(data ?? [])
      setEstado({ tipo: 'escaneando' })
    }
    init()
  }, [])

  // Loop de detección
  useEffect(() => {
    if (!ready || estado.tipo !== 'escaneando') return
    let raf = 0
    let active = true

    const scan = async () => {
      if (!active || lockRef.current || !videoRef.current) { raf = requestAnimationFrame(scan); return }
      const desc = await getDescriptor(videoRef.current)
      if (desc) {
        const found = matchDescriptor(desc, empleados)
        if (found) {
          lockRef.current = true
          await registrar(found.match)
        }
      }
      if (active) raf = requestAnimationFrame(scan)
    }
    raf = requestAnimationFrame(scan)
    return () => { active = false; cancelAnimationFrame(raf) }
  }, [ready, estado.tipo, empleados])

  const registrar = async (emp: Empleado) => {
    // Determina si es entrada o salida según la última marcación de hoy
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const { data: ultimas } = await supabase
      .from('marcaciones')
      .select('tipo')
      .eq('empleado_id', emp.id)
      .gte('timestamp', hoy.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)

    const marca: 'entrada' | 'salida' = ultimas?.[0]?.tipo === 'entrada' ? 'salida' : 'entrada'
    const now = new Date()
    await supabase.from('marcaciones').insert({ empleado_id: emp.id, tipo: marca, timestamp: now.toISOString() })

    setEstado({ tipo: 'exito', empleado: emp, marca, hora: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) })
    setTimeout(() => { setEstado({ tipo: 'escaneando' }); lockRef.current = false }, 2800)
  }

  const fecha = reloj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hora = reloj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-brand-700 flex flex-col items-center justify-center p-4 text-white">
      <div className="absolute top-6 left-0 right-0 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
          Terminal de Asistencia Biométrica
        </p>
        <div className="text-4xl font-bold tabular-nums tracking-tight flex items-center justify-center gap-2">
          <Clock size={28} /> {hora}
        </div>
        <p className="text-white/70 capitalize mt-1">{fecha}</p>
      </div>

      <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden bg-black/40 shadow-2xl border-4 border-white/10">
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />

        {/* Overlay de estado */}
        {estado.tipo === 'cargando' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="animate-spin" size={48} />
            <p className="text-lg">Iniciando sistema...</p>
          </div>
        )}
        {estado.tipo === 'exito' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-600/95 gap-2 animate-[fadeIn_.3s]">
            <CheckCircle2 size={72} />
            <p className="text-2xl font-bold">{estado.empleado.nombre}</p>
            <p className="text-xl capitalize">{estado.marca} registrada</p>
            <p className="text-lg text-white/80">{estado.hora}</p>
          </div>
        )}
        {estado.tipo === 'no_reconocido' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/95 gap-2">
            <XCircle size={72} />
            <p className="text-xl font-bold">No reconocido</p>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-white/80 text-lg">
        {estado.tipo === 'escaneando' ? 'Ubique su rostro frente a la cámara' : ''}
      </p>
      {error && <p className="mt-4 text-red-200">{error}</p>}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
