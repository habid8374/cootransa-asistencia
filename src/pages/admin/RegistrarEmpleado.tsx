import { useEffect, useState } from 'react'
import { supabase, type TipoEmpleado } from '../../lib/supabase'
import { loadModels, getDescriptor } from '../../lib/face'
import { hashPin } from '../../lib/crypto'
import { useCamera } from '../../hooks/useCamera'
import { Camera, Loader2, CheckCircle2, X, LogIn, LogOut, RefreshCw } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function capturarFoto(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = 320; canvas.height = 240
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.75)
}

export default function RegistrarEmpleado({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { videoRef, ready, error } = useCamera()
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [cargo, setCargo] = useState('')
  const [pin, setPin] = useState('')
  const [horaEntrada, setHoraEntrada] = useState('')
  const [horaSalida, setHoraSalida] = useState('')
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [tipoEmpleadoId, setTipoEmpleadoId] = useState('')
  const [tipos, setTipos] = useState<TipoEmpleado[]>([])
  const [modoRecaptura, setModoRecaptura] = useState(false)
  const [capturando, setCapturando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('tipos_empleado').select('*').order('nombre').then(({ data }) => setTipos(data ?? []))
  }, [])

  const capturar = async () => {
    if (!videoRef.current) return
    setCapturando(true); setMsg('')
    await loadModels()
    const desc = await getDescriptor(videoRef.current)
    if (desc) {
      setDescriptor(Array.from(desc))
      setFotoUrl(capturarFoto(videoRef.current))
      setModoRecaptura(false)
      setMsg('Rostro y foto capturados correctamente.')
    } else {
      setMsg('No se detectó ningún rostro. Ubíquese frente a la cámara e intente de nuevo.')
    }
    setCapturando(false)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descriptor) { setMsg('Debe capturar el rostro del empleado.'); return }
    if (pin && pin.length !== 4) { setMsg('El PIN debe tener exactamente 4 dígitos.'); return }
    if (!horaEntrada || !horaSalida) { setMsg('La hora de entrada y salida son obligatorias.'); return }
    setSaving(true)
    const pinHash = pin ? await hashPin(pin) : null
    const { error: err } = await supabase.from('empleados').insert({
      nombre, cedula, cargo: cargo || null, descriptor, activo: true,
      hora_entrada: horaEntrada, hora_salida: horaSalida,
      tipo_empleado_id: tipoEmpleadoId || null,
      ...(pinHash ? { pin: pinHash } : {}),
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    })
    setSaving(false)
    if (err) { setMsg('Error al guardar: ' + err.message); return }
    onSaved(); onClose()
  }

  const esError = msg.startsWith('Error') || msg.startsWith('No se') || msg.startsWith('El PIN') || msg.startsWith('Debe') || msg.startsWith('La hora')
  const mostrarVideo = !fotoUrl || modoRecaptura

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Registrar empleado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {/* Recuadro de cámara / foto */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-900">
            {/* Video siempre en el DOM para mantener el stream activo */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${mostrarVideo ? 'opacity-100' : 'opacity-0'}`}
              muted playsInline
            />

            {/* Foto capturada como overlay */}
            {fotoUrl && !modoRecaptura && (
              <img
                src={fotoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Foto capturada"
              />
            )}

            {/* Banner inferior cuando hay foto */}
            {fotoUrl && !modoRecaptura && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-3 px-4 flex items-center justify-center gap-2">
                <CheckCircle2 size={15} className="text-brand-400 shrink-0" />
                <span className="text-white text-sm font-semibold">Foto de perfil lista</span>
              </div>
            )}

            {/* Instrucción cuando no hay foto */}
            {!fotoUrl && !capturando && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-3 px-4 text-center">
                <span className="text-white/70 text-xs">Centre el rostro en el recuadro</span>
              </div>
            )}
          </div>

          {/* Botones de captura */}
          {fotoUrl && !modoRecaptura ? (
            <button
              type="button"
              onClick={() => setModoRecaptura(true)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} /> Recapturar foto
            </button>
          ) : (
            <button
              type="button"
              onClick={capturar}
              disabled={!ready || capturando}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {capturando ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {capturando ? 'Detectando rostro...' : modoRecaptura ? 'Capturar de nuevo' : 'Capturar rostro y foto'}
            </button>
          )}

          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" required className={INPUT} />
          <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Cédula" required className={INPUT} />
          <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo (opcional)" className={INPUT} />
          {tipos.length > 0 && (
            <select value={tipoEmpleadoId} onChange={e => setTipoEmpleadoId(e.target.value)} className={INPUT}>
              <option value="">Tipo de empleado (opcional)</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          )}

          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN de 4 dígitos (respaldo facial)"
              className={INPUT}
            />
            <p className="text-xs text-gray-400 mt-1 pl-1">Se usa si el reconocimiento facial falla 3 veces seguidas.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <LogIn size={11} /> Hora entrada <span className="text-red-400">*</span>
              </label>
              <input type="time" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} required className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <LogOut size={11} /> Hora salida <span className="text-red-400">*</span>
              </label>
              <input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} required className={INPUT} />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2 pl-1">Horario esperado para detectar tardanzas y salidas anticipadas.</p>

          {msg && <p className={`text-sm ${esError ? 'text-red-600' : 'text-brand-600'}`}>{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar empleado'}
          </button>
        </form>
      </div>
    </div>
  )
}
