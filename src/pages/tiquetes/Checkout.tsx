import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase, type Viaje } from '../../lib/supabase'
import { urlCheckout } from '../../lib/wompi'
import { ArrowLeft, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

type Metodo = 'taquilla' | 'nequi' | 'daviplata' | 'tarjeta'

const METODOS: { key: Metodo; label: string; icon: string; desc: string }[] = [
  { key: 'taquilla',  label: 'Pagar en taquilla', icon: '🏷️', desc: 'Reserva ahora, paga al abordar' },
  { key: 'nequi',     label: 'Nequi',             icon: '💜', desc: 'Pago móvil Bancolombia' },
  { key: 'daviplata', label: 'Daviplata',          icon: '🔴', desc: 'Pago móvil Davivienda' },
  { key: 'tarjeta',   label: 'Tarjeta / PSE',      icon: '💳', desc: 'Pago seguro con Wompi' },
]

const NEQUI_NUM = '3001234567'

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const viajeId = params.get('viaje_id') ?? ''

  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [metodo, setMetodo] = useState<Metodo>('taquilla')
  const [referencia, setReferencia] = useState('')
  const [comprando, setComprando] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!viajeId) return
    supabase.from('viajes').select('*, ruta:rutas(*), bus:buses(*)').eq('id', viajeId).single()
      .then(({ data }) => setViaje(data as Viaje))
  }, [viajeId])

  // Crea pasajero y tiquete, retorna el tiquete ID
  const crearTiquete = async (estadoInicial: 'pendiente' | 'confirmado', metodoPago: Metodo, ref?: string) => {
    if (!viaje) return null
    if (!nombre.trim() || !cedula.trim()) { setErr('Nombre y cédula son obligatorios.'); return null }

    const { data: pas, error: pasErr } = await supabase
      .from('pasajeros')
      .upsert({ nombre: nombre.trim(), cedula: cedula.trim(), email: email.trim() || null, telefono: telefono.trim() || null }, { onConflict: 'cedula' })
      .select('id').single()

    if (pasErr || !pas) { setErr('Error al registrar pasajero.'); return null }

    const { data: tiq, error: tiqErr } = await supabase
      .from('tiquetes')
      .insert({
        viaje_id: viaje.id,
        pasajero_id: pas.id,
        precio: viaje.precio,
        estado: estadoInicial,
        metodo_pago: metodoPago,
        referencia_pago: ref ?? null,
      })
      .select('id').single()

    if (tiqErr || !tiq) { setErr('Error al crear tiquete.'); return null }

    await supabase.from('viajes').update({ capacidad_disponible: viaje.capacidad_disponible - 1 }).eq('id', viaje.id)
    return tiq.id as string
  }

  const comprar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !cedula.trim()) { setErr('Nombre y cédula son obligatorios.'); return }
    if ((metodo === 'nequi' || metodo === 'daviplata') && !referencia.trim()) {
      setErr('Ingresa el número de comprobante del pago.'); return
    }
    setComprando(true); setErr('')

    if (metodo === 'tarjeta') {
      // Crear tiquete pendiente → redirigir a Wompi
      const tiqueteId = await crearTiquete('pendiente', 'tarjeta')
      if (!tiqueteId) { setComprando(false); return }
      const amountInCents = Math.round(viaje!.precio * 100)
      const redirectUrl = `${window.location.origin}/tiquetes/ver/${tiqueteId}`
      const wompiUrl = await urlCheckout(tiqueteId, amountInCents, redirectUrl)
      window.location.href = wompiUrl
      return
    }

    const estado = metodo === 'taquilla' ? 'pendiente' : 'confirmado'
    const tiqueteId = await crearTiquete(estado, metodo, referencia.trim() || undefined)
    setComprando(false)
    if (!tiqueteId) return
    navigate(`/tiquetes/ver/${tiqueteId}`)
  }

  if (!viaje) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-600 px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <Link
            to={`/tiquetes/viajes?origen=${viaje.ruta?.origen}&destino=${viaje.ruta?.destino}&fecha=${viaje.fecha}`}
            className="flex items-center gap-1.5 text-brand-200 text-sm mb-4 hover:text-white transition"
          >
            <ArrowLeft size={15} /> Volver
          </Link>
          <p className="text-white font-bold text-lg">{viaje.ruta?.origen} → {viaje.ruta?.destino}</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-brand-200 text-sm flex items-center gap-1"><Clock size={13} /> {viaje.hora_salida.slice(0, 5)}</span>
            <span className="text-brand-200 text-sm flex items-center gap-1"><MapPin size={13} /> {viaje.fecha}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-8">
        <form onSubmit={comprar} className="space-y-4">
          {/* Resumen */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">1 pasajero</span>
              <span className="text-lg font-bold text-brand-600">${viaje.precio.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Users size={11} /> {viaje.capacidad_disponible} cupos disponibles
            </div>
          </div>

          {/* Datos del pasajero */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos del pasajero</p>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo *" required className={INPUT} />
            <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Número de cédula *" required className={INPUT} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico (opcional)" className={INPUT} />
            <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono (opcional)" className={INPUT} />
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Método de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {METODOS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMetodo(m.key)}
                  className={`p-3 rounded-xl border-2 text-left transition ${metodo === m.key ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Instrucciones según método */}
            {(metodo === 'nequi' || metodo === 'daviplata') && (
              <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-purple-800">
                  Envía ${viaje.precio.toLocaleString('es-CO')} al {NEQUI_NUM} (COOTRANSA)
                </p>
                <p className="text-xs text-purple-600">Luego ingresa el comprobante aquí:</p>
                <input value={referencia} onChange={e => setReferencia(e.target.value)}
                  placeholder="Número de comprobante / referencia" className={INPUT} />
              </div>
            )}

            {metodo === 'tarjeta' && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-blue-800">Pago seguro con Wompi</p>
                <p className="text-xs text-blue-600">
                  Al confirmar te redirigimos a la plataforma de pago de Bancolombia donde puedes pagar con tarjeta crédito, débito o PSE.
                </p>
              </div>
            )}

            {metodo === 'taquilla' && (
              <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-xs text-green-700">Tu tiquete queda reservado. Paga al abordar el bus.</p>
              </div>
            )}
          </div>

          {err && <p className="text-sm text-red-600 px-1">{err}</p>}

          <button
            type="submit"
            disabled={comprando}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-60 shadow-lg"
          >
            {comprando
              ? (metodo === 'tarjeta' ? 'Redirigiendo a pago...' : 'Procesando...')
              : metodo === 'tarjeta'
                ? `Pagar $${viaje.precio.toLocaleString('es-CO')} con Wompi →`
                : `Confirmar tiquete · $${viaje.precio.toLocaleString('es-CO')}`
            }
          </button>
          <p className="text-center text-xs text-gray-400">
            Al confirmar aceptas las condiciones de transporte de COOTRANSA
          </p>
        </form>
      </div>
    </div>
  )
}
