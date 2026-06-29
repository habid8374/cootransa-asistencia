import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Terminal from './pages/Terminal'
import Login from './pages/Login'
import AdminPanel from './pages/admin/AdminPanel'
import TiquetesAdminPanel from './pages/admin/TiquetesAdminPanel'
import TiquetesHome from './pages/tiquetes/TiquetesHome'
import BuscarViajes from './pages/tiquetes/BuscarViajes'
import Checkout from './pages/tiquetes/Checkout'
import MiTiquete from './pages/tiquetes/MiTiquete'
import MisTiquetes from './pages/tiquetes/MisTiquetes'
import ValidarQR from './pages/conductor/ValidarQR'
import ManualUsuario from './pages/admin/ManualUsuario'
import GuionPresentacion from './pages/admin/GuionPresentacion'

function TiquetesAdminGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }
  return session ? <TiquetesAdminPanel /> : <Login />
}

function AdminGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }
  return session ? <AdminPanel /> : <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/tiquetes/admin" element={<TiquetesAdminGate />} />
        <Route path="/tiquetes" element={<TiquetesHome />} />
        <Route path="/tiquetes/viajes" element={<BuscarViajes />} />
        <Route path="/tiquetes/checkout" element={<Checkout />} />
        <Route path="/tiquetes/ver/:id" element={<MiTiquete />} />
        <Route path="/tiquetes/mis-tiquetes" element={<MisTiquetes />} />
        <Route path="/admin/manual" element={<ManualUsuario />} />
        <Route path="/admin/guion" element={<GuionPresentacion />} />
        <Route path="/conductor" element={<ValidarQR />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
