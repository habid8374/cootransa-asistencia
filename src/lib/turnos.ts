import { type EmpleadoTurno, type Festivo } from './supabase'

export interface HorarioDia {
  hora_entrada: string
  hora_salida: string
  trabaja: boolean
}

export function getHorarioDia(
  empleadoId: string,
  fecha: string,             // YYYY-MM-DD
  asignaciones: EmpleadoTurno[],
  festivos: Festivo[],
  fallbackEntrada?: string,
  fallbackSalida?: string,
): HorarioDia | null {
  const asignacion = asignaciones.find(
    a => a.empleado_id === empleadoId && a.fecha_inicio <= fecha && a.fecha_fin >= fecha
  )

  if (!asignacion?.turno) {
    if (fallbackEntrada && fallbackSalida) {
      return { hora_entrada: fallbackEntrada, hora_salida: fallbackSalida, trabaja: true }
    }
    return null
  }

  const t = asignacion.turno
  const esFestivo = festivos.some(f => f.fecha === fecha)
  const dow = new Date(fecha + 'T12:00:00').getDay() // 0=Dom, 6=Sab

  let entrada: string | undefined
  let salida: string | undefined

  if (esFestivo) {
    entrada = t.hora_entrada_festivo ?? undefined
    salida = t.hora_salida_festivo ?? undefined
  } else if (dow === 0) {
    entrada = t.hora_entrada_dom ?? undefined
    salida = t.hora_salida_dom ?? undefined
  } else if (dow === 6) {
    entrada = t.hora_entrada_sab ?? undefined
    salida = t.hora_salida_sab ?? undefined
  } else {
    entrada = t.hora_entrada_lv ?? undefined
    salida = t.hora_salida_lv ?? undefined
  }

  if (!entrada || !salida) {
    return { hora_entrada: '', hora_salida: '', trabaja: false }
  }

  return { hora_entrada: entrada, hora_salida: salida, trabaja: true }
}

// Colombian public holidays 2025–2026 for preload
export const FESTIVOS_CO: { fecha: string; nombre: string }[] = [
  { fecha: '2025-01-01', nombre: 'Año Nuevo' },
  { fecha: '2025-01-06', nombre: 'Reyes Magos' },
  { fecha: '2025-03-24', nombre: 'San José' },
  { fecha: '2025-04-17', nombre: 'Jueves Santo' },
  { fecha: '2025-04-18', nombre: 'Viernes Santo' },
  { fecha: '2025-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2025-06-02', nombre: 'Ascensión del Señor' },
  { fecha: '2025-06-23', nombre: 'Corpus Christi' },
  { fecha: '2025-06-30', nombre: 'Sagrado Corazón' },
  { fecha: '2025-07-07', nombre: 'San Pedro y San Pablo' },
  { fecha: '2025-07-20', nombre: 'Independencia de Colombia' },
  { fecha: '2025-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2025-08-18', nombre: 'Asunción de la Virgen' },
  { fecha: '2025-10-13', nombre: 'Día de la Raza' },
  { fecha: '2025-11-03', nombre: 'Todos los Santos' },
  { fecha: '2025-11-17', nombre: 'Independencia de Cartagena' },
  { fecha: '2025-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2025-12-25', nombre: 'Navidad' },
  // 2026
  { fecha: '2026-01-01', nombre: 'Año Nuevo' },
  { fecha: '2026-01-12', nombre: 'Reyes Magos' },
  { fecha: '2026-03-23', nombre: 'San José' },
  { fecha: '2026-04-02', nombre: 'Jueves Santo' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2026-05-18', nombre: 'Ascensión del Señor' },
  { fecha: '2026-06-08', nombre: 'Corpus Christi' },
  { fecha: '2026-06-15', nombre: 'Sagrado Corazón' },
  { fecha: '2026-07-06', nombre: 'San Pedro y San Pablo' },
  { fecha: '2026-07-20', nombre: 'Independencia de Colombia' },
  { fecha: '2026-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2026-08-17', nombre: 'Asunción de la Virgen' },
  { fecha: '2026-10-12', nombre: 'Día de la Raza' },
  { fecha: '2026-11-02', nombre: 'Todos los Santos' },
  { fecha: '2026-11-16', nombre: 'Independencia de Cartagena' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2026-12-25', nombre: 'Navidad' },
]
