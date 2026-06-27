import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Correo o contraseña incorrectos.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-brand-700 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">COOTRANSA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control de Asistencia</p>
        </div>
        <div className="space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Ingresar
          </button>
        </div>
      </form>
    </div>
  )
}
