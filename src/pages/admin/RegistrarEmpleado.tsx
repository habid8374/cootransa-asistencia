import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { loadModels, getDescriptor } from '../../lib/face'
import { useCamera } from '../../hooks/useCamera'
import { Camera, Loader2, CheckCircle2, X, Clock } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function capturarFoto(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = 160; canvas.height = 120
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.65)
}

export default function RegistrarEmpleado({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { videoRef, ready, error } = useCamera()
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [cargo, setCargo] = useState('')
  const [pin, setPin] = useState('')
  const [horaEntrada, setHoraEntrada] = useState('')
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [capturando, setCapturando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const capturar = async () => {
    if (!videoRef.current) return
    setCapturando(true); setMsg('')
    await loadModels()
    const desc = await getDescriptor(videoRef.current)
    if (desc) {
      setDescriptor(Array.from(desc))
      setFotoUrl(capturarFoto(videoRef.current))
      setMsg('Rostro capturado correctamente')
    } else {
      setMsg('No se detectó ningún rostro. Intente de nuevo.')
    }
    setCapturando(false)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descriptor) { setMsg('Debe capturar el rostro del empleado.'); return }
    if (pin && pin.length !== 4) { setMsg('El PIN debe tener exactamente 4 dígitos.'); return }
    setSaving(true)
    const { error: err } = await supabase.from('empleados').insert({
      nombre, cedula, cargo: cargo || null, descriptor, activo: true,
      ...(pin ? { pin } : {}),
      ...(horaEntrada ? { hora_entrada: horaEntrada } : {}),
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    })
    setSaving(false)
    if (err) { setMsg('Error al guardar: ' + err.message); return }
    onSaved(); onClose()
  }

  const esError = msg.startsWith('Error') || msg.startsWith('No se') || msg.startsWith('El PIN') || msg.startsWith('Debe')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Registrar empleado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={guardar} className="p-6 space-y-4">
          {/* Camera */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-900">
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
            {fotoUrl && (
              <div className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1.5"><CheckCircle2 size={18} /></div>
            )}
          </div>
          <button
            type="button"
            onClick={capturar}
            disabled={!ready || capturando}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {capturando ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {descriptor ? 'Volver a capturar rostro' : 'Capturar rostro'}
          </button>

          {fotoUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img src={fotoUrl} className="w-12 h-9 rounded object-cover border border-gray-200" alt="Foto" />
              <p className="text-xs text-gray-500">Foto de perfil capturada</p>
            </div>
          )}

          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" required className={INPUT} />
          <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Cédula" required className={INPUT} />
          <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo (opcional)" className={INPUT} />

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

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Clock size={12} /> Hora de entrada esperada (opcional)
            </label>
            <input
              type="time"
              value={horaEntrada}
              onChange={e => setHoraEntrada(e.target.value)}
              className={INPUT}
            />
            <p className="text-xs text-gray-400 mt-1 pl-1">Se usa para detectar tardanzas en el dashboard.</p>
          </div>

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
