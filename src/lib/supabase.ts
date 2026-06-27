import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

export interface TipoEmpleado {
  id: string
  nombre: string
  created_at?: string
}

export interface Turno {
  id: string
  nombre: string
  tipo_empleado_id?: string
  hora_entrada_lv?: string
  hora_salida_lv?: string
  hora_entrada_sab?: string
  hora_salida_sab?: string
  hora_entrada_dom?: string
  hora_salida_dom?: string
  hora_entrada_festivo?: string
  hora_salida_festivo?: string
  created_at?: string
  tipo_empleado?: TipoEmpleado
}

export interface Festivo {
  id: string
  fecha: string        // YYYY-MM-DD
  nombre: string
  created_at?: string
}

export interface EmpleadoTurno {
  id: string
  empleado_id: string
  turno_id: string
  fecha_inicio: string // YYYY-MM-DD
  fecha_fin: string    // YYYY-MM-DD
  created_at?: string
  turno?: Turno
  empleado?: Pick<Empleado, 'nombre' | 'cedula'>
}

export interface Empleado {
  id: string
  nombre: string
  cedula: string
  cargo?: string
  foto_url?: string
  descriptor?: number[]
  pin?: string
  hora_entrada?: string  // HH:MM fallback cuando no hay turno asignado
  hora_salida?: string   // HH:MM fallback cuando no hay turno asignado
  activo: boolean
  tipo_empleado_id?: string
  tipo_empleado?: TipoEmpleado
  created_at?: string
}

export interface Marcacion {
  id: string
  empleado_id: string
  tipo: 'entrada' | 'salida'
  timestamp: string
  empleado?: Empleado
}

export interface Permiso {
  id: string
  empleado_id: string
  nombre: string
  fecha: string       // YYYY-MM-DD
  hora_inicio?: string  // HH:MM — null = día completo
  hora_fin?: string     // HH:MM — null = día completo
  created_at?: string
  empleado?: Pick<Empleado, 'nombre' | 'cedula'>
}

// ── Módulo de Tiquetes ─────────────────────────────────────────

export interface Ruta {
  id: string
  origen: string
  destino: string
  precio_base: number
  duracion_min?: number
  activa: boolean
  created_at?: string
}

export interface Bus {
  id: string
  placa: string
  nombre?: string
  capacidad: number
  activo: boolean
  created_at?: string
}

export interface Viaje {
  id: string
  ruta_id: string
  bus_id?: string
  fecha: string
  hora_salida: string
  precio: number
  capacidad_disponible: number
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado'
  created_at?: string
  ruta?: Ruta
  bus?: Bus
}

export interface Pasajero {
  id: string
  nombre: string
  cedula: string
  email?: string
  telefono?: string
  created_at?: string
}

export interface Tiquete {
  id: string
  viaje_id: string
  pasajero_id: string
  precio: number
  estado: 'pendiente' | 'confirmado' | 'usado' | 'cancelado'
  metodo_pago?: 'nequi' | 'daviplata' | 'pse' | 'tarjeta' | 'taquilla'
  referencia_pago?: string
  usado_at?: string
  created_at?: string
  viaje?: Viaje
  pasajero?: Pasajero
}
