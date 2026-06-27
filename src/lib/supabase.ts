import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

export interface Empleado {
  id: string
  nombre: string
  cedula: string
  cargo?: string
  foto_url?: string
  descriptor?: number[]
  pin?: string
  hora_entrada?: string  // HH:MM expected arrival for tardanza detection
  activo: boolean
  created_at?: string
}

export interface Marcacion {
  id: string
  empleado_id: string
  tipo: 'entrada' | 'salida'
  timestamp: string
  empleado?: Empleado
}
