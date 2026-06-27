import { useEffect, useRef, useState } from 'react'
import { supabase, type Empleado } from '../lib/supabase'
import { loadModels, getDescriptor, matchDescriptor } from '../lib/face'
import { useCamera } from '../hooks/useCamera'
import { CheckCircle2, Loader2, Clock, Search, ChevronLeft, AlertCircle } from 'lucide-react'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'escaneando' }
  | { tipo: 'exito'; empleado: Empleado; marca: 'entrada' | 'salida'; hora: string }
  | { tipo: 'fallback' }

export default function Terminal() {
  const { videoRef, ready, error } = useCamera()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [reloj, setReloj] = useState(new Date())
  const lockRef = useRef(false)
  const fallidosRef = useRef(0)

  // Fallback state
  const [busqueda, setBusqueda] = useState('')
  const [empSeleccionado, setEmpSeleccionado] = useState<Empleado | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const resetFallback = () => {
    setBusqueda('')
    setEmpSeleccionado(null)
    setPin('')
    setPinError(false)
    fallidosRef.current = 0
  }

  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function init() {
      await loadModels()
      const { data } = await supabase.from('empleados').select('*').eq('activo', true)
      setEmpleados(data ?? [])
      setEstado({ tipo: 'escaneando' })
    }
    init()
  }, [])

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
          fallidosRef.current = 0
          lockRef.current = true
          await registrar(found.match)
        } else {
          fallidosRef.current++
          if (fallidosRef.current >= 3) {
            fallidosRef.current = 0
            lockRef.current = true
            setEstado({ tipo: 'fallback' })
          }
        }
      } else {
        fallidosRef.current = 0
      }
      if (active) raf = requestAnimationFrame(scan)
    }
    raf = requestAnimationFrame(scan)
    return () => { active = false; cancelAnimationFrame(raf) }
  }, [ready, estado.tipo, empleados])

  const registrar = async (emp: Empleado) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const { data: ultimas } = await supabase
      .from('marcaciones').select('tipo')
      .eq('empleado_id', emp.id)
      .gte('timestamp', hoy.toISOString())
      .order('timestamp', { ascending: false }).limit(1)

    const marca: 'entrada' | 'salida' = ultimas?.[0]?.tipo === 'entrada' ? 'salida' : 'entrada'
    const now = new Date()
    await supabase.from('marcaciones').insert({ empleado_id: emp.id, tipo: marca, timestamp: now.toISOString() })

    setEstado({ tipo: 'exito', empleado: emp, marca, hora: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) })
    setTimeout(() => {
      resetFallback()
      lockRef.current = false
      setEstado({ tipo: 'escaneando' })
    }, 2800)
  }

  const volverAlEscaner = () => {
    resetFallback()
    lockRef.current = false
    setEstado({ tipo: 'escaneando' })
  }

  const presionarTecla = async (tecla: string) => {
    if (pinError) setPinError(false)
    if (tecla === 'borrar') {
      setPin(p => p.slice(0, -1))
      return
    }
    if (pin.length >= 4) return
    const nuevo = pin + tecla
    setPin(nuevo)
    if (nuevo.length === 4) {
      await verificarPin(nuevo)
    }
  }

  const verificarPin = async (pinIngresado: string) => {
    if (!empSeleccionado) return
    if (!empSeleccionado.pin || empSeleccionado.pin !== pinIngresado) {
      setPinError(true)
      setTimeout(() => { setPin(''); setPinError(false) }, 900)
      return
    }
    lockRef.current = true
    setPin('')
    await registrar(empSeleccionado)
  }

  const empleadosFiltrados = empleados
    .filter(e =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.cedula.includes(busqueda)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const fecha = reloj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hora = reloj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-brand-700 flex flex-col items-center justify-center p-4 text-white">

      {/* Cabecera con reloj */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
          Terminal de Asistencia Biométrica
        </p>
        <div className="text-4xl font-bold tabular-nums tracking-tight flex items-center justify-center gap-2">
          <Clock size={28} /> {hora}
        </div>
        <p className="text-white/70 capitalize mt-1">{fecha}</p>
      </div>

      {/* Cámara */}
      <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden bg-black/40 shadow-2xl border-4 border-white/10">
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />

        {/* Cargando */}
        {estado.tipo === 'cargando' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="animate-spin" size={48} />
            <p className="text-lg">Iniciando sistema...</p>
          </div>
        )}

        {/* Éxito */}
        {estado.tipo === 'exito' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-600/95 gap-2" style={{ animation: 'fadeIn .3s ease' }}>
            <CheckCircle2 size={72} />
            <p className="text-2xl font-bold">{estado.empleado.nombre}</p>
            <p className="text-xl capitalize">{estado.marca} registrada</p>
            <p className="text-lg text-white/80">{estado.hora}</p>
          </div>
        )}

        {/* Fallback: identificación manual */}
        {estado.tipo === 'fallback' && (
          <div className="absolute inset-0 bg-slate-900/98 flex flex-col overflow-hidden">

            {/* Fase 1: buscar empleado */}
            {!empSeleccionado && (
              <div className="flex flex-col h-full p-4 gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={volverAlEscaner} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-sm font-bold">Identificación manual</h2>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    autoFocus
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o cédula..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-white/40 outline-none focus:border-white/40 transition"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                  {empleadosFiltrados.length === 0 ? (
                    <p className="text-center text-white/40 text-sm py-8">Sin resultados</p>
                  ) : empleadosFiltrados.map(e => (
                    <button
                      key={e.id}
                      onClick={() => setEmpSeleccionado(e)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {e.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{e.nombre}</p>
                        <p className="text-xs text-white/50">{e.cedula}{e.cargo ? ` · ${e.cargo}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fase 2: teclado PIN */}
            {empSeleccionado && (
              <div className="flex flex-col items-center h-full p-4 gap-3">
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => { setEmpSeleccionado(null); setPin(''); setPinError(false) }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {empSeleccionado.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold truncate">{empSeleccionado.nombre}</p>
                  </div>
                </div>

                <p className="text-white/50 text-xs mt-1">Ingrese su PIN de 4 dígitos</p>

                {/* Puntos del PIN */}
                <div className="flex gap-4 my-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      pinError
                        ? 'border-red-400 bg-red-400'
                        : i < pin.length
                          ? 'bg-white border-white scale-110'
                          : 'border-white/30'
                    }`} />
                  ))}
                </div>

                {pinError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs -mt-1">
                    <AlertCircle size={13} /> PIN incorrecto
                  </div>
                )}

                {/* Teclado numérico */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[200px] mt-1">
                  {['1','2','3','4','5','6','7','8','9'].map(n => (
                    <button
                      key={n}
                      onClick={() => presionarTecla(n)}
                      className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 active:bg-white/30 text-xl font-bold transition-all"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => presionarTecla('borrar')}
                    className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-base font-bold transition-all flex items-center justify-center"
                  >
                    ⌫
                  </button>
                  <button
                    onClick={() => presionarTecla('0')}
                    className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 active:bg-white/30 text-xl font-bold transition-all"
                  >
                    0
                  </button>
                  <div />
                </div>
              </div>
            )}
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
