import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { loadModels, getDescriptor } from '../../lib/face'
import { useCamera } from '../../hooks/useCamera'
import { Camera, Loader2, CheckCircle2, X } from 'lucide-react'

export default function RegistrarEmpleado({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { videoRef, ready, error } = useCamera()
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [cargo, setCargo] = useState('')
  const [pin, setPin] = useState('')
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
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
    const { error } = await supabase.from('empleados').insert({
      nombre, cedula, cargo, descriptor, activo: true, ...(pin ? { pin } : {}),
    })
    setSaving(false)
    if (error) { setMsg('Error al guardar: ' + error.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Registrar empleado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={guardar} className="p-6 space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-900">
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
            {descriptor && (
              <div className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1.5"><CheckCircle2 size={18} /></div>
            )}
          </div>
          <button type="button" onClick={capturar} disabled={!ready || capturando}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition flex items-center justify-center gap-2 disabled:opacity-60">
            {capturando ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {descriptor ? 'Volver a capturar rostro' : 'Capturar rostro'}
          </button>

          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Cédula" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          <input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Cargo (opcional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN de 4 dígitos (respaldo facial)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <p className="text-xs text-gray-400 mt-1 pl-1">Se usa si el reconocimiento facial falla 3 veces seguidas.</p>
          </div>

          {msg && <p className={`text-sm ${descriptor ? 'text-brand-600' : 'text-red-600'}`}>{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar empleado'}
          </button>
        </form>
      </div>
    </div>
  )
}
