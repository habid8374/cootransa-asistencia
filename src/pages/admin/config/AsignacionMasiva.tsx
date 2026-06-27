import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase, type Empleado, type Turno, type EmpleadoTurno } from '../../../lib/supabase'
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, Save, Pencil, X, Trash2 } from 'lucide-react'

interface Fila {
  cedula: string
  nombreArchivo: string
  turno: string
  fechaInicio: string
  fechaFin: string
  // resolved
  empleado?: Empleado
  turnoObj?: Turno
  conflicto?: EmpleadoTurno
  errores: string[]
  advertencias: string[]
}

const INPUT = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-500'
const hoy = new Date().toISOString().slice(0, 10)
const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

export default function AsignacionMasiva() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [asignaciones, setAsignaciones] = useState<EmpleadoTurno[]>([])
  const [filas, setFilas] = useState<Fila[]>([])
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: number; err: number } | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editFila, setEditFila] = useState<Fila | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cargar = async () => {
    const [{ data: emps }, { data: ts }, { data: asig }] = await Promise.all([
      supabase.from('empleados').select('id, nombre, cedula, cargo, activo').order('nombre'),
      supabase.from('turnos').select('*').order('nombre'),
      supabase.from('empleado_turnos').select('*, turno:turnos(nombre)').gte('fecha_fin', hoy),
    ])
    setEmpleados((emps as Empleado[]) ?? [])
    setTurnos((ts as Turno[]) ?? [])
    setAsignaciones((asig as EmpleadoTurno[]) ?? [])
  }

  useEffect(() => { cargar() }, [])

  const descargarPlantilla = () => {
    const wb = XLSX.utils.book_new()
    const header = [['Cédula', 'Nombre Empleado', 'Turno', 'Fecha Inicio (YYYY-MM-DD)', 'Fecha Fin (YYYY-MM-DD)']]
    const empRows = empleados.map(e => [e.cedula, e.nombre, '', hoy, finMes])
    const ws = XLSX.utils.aoa_to_sheet([...header, ...empRows])

    // Column widths
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 22 }]

    // Header style note in A1 comment area — add turnos list in a separate sheet
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Turnos disponibles'],
      ...turnos.map(t => [t.nombre]),
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaciones')
    XLSX.utils.book_append_sheet(wb, ws2, 'Turnos disponibles')
    XLSX.writeFile(wb, `plantilla-asignacion-${hoy}.xlsx`)
  }

  const validarFila = (
    cedula: string, nombreArchivo: string, turnoNombre: string,
    fechaInicio: string, fechaFin: string,
    emps: Empleado[], ts: Turno[], asig: EmpleadoTurno[]
  ): Fila => {
    const errores: string[] = []
    const advertencias: string[] = []

    const empleado = emps.find(e => e.cedula === String(cedula).trim())
    if (!empleado) errores.push(`Cédula ${cedula} no encontrada`)

    const turnoObj = ts.find(t => t.nombre.toLowerCase() === String(turnoNombre).trim().toLowerCase())
    if (!turnoNombre?.toString().trim()) errores.push('Turno vacío')
    else if (!turnoObj) errores.push(`Turno "${turnoNombre}" no existe`)

    if (!fechaInicio) errores.push('Fecha inicio vacía')
    if (!fechaFin) errores.push('Fecha fin vacía')
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) errores.push('Fecha inicio mayor que fecha fin')

    let conflicto: EmpleadoTurno | undefined
    if (empleado && fechaInicio && fechaFin) {
      conflicto = asig.find(a =>
        a.empleado_id === empleado.id &&
        a.fecha_inicio <= fechaFin && a.fecha_fin >= fechaInicio
      )
      if (conflicto) advertencias.push(`Ya tiene turno "${(conflicto as any).turno?.nombre}" en ese período (se reemplazará)`)
    }

    return {
      cedula: String(cedula).trim(), nombreArchivo: String(nombreArchivo ?? ''),
      turno: String(turnoNombre ?? '').trim(),
      fechaInicio: String(fechaInicio ?? '').trim(), fechaFin: String(fechaFin ?? '').trim(),
      empleado, turnoObj, conflicto, errores, advertencias,
    }
  }

  const procesarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResultado(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      const parsed: Fila[] = rows.map(r => {
        const cedula = r['Cédula'] ?? r['cedula'] ?? r['CEDULA'] ?? ''
        const nombreArchivo = r['Nombre Empleado'] ?? r['nombre'] ?? ''
        const turnoNombre = r['Turno'] ?? r['turno'] ?? ''
        const fi = r['Fecha Inicio (YYYY-MM-DD)'] ?? r['Fecha Inicio'] ?? r['fecha_inicio'] ?? ''
        const ff = r['Fecha Fin (YYYY-MM-DD)'] ?? r['Fecha Fin'] ?? r['fecha_fin'] ?? ''
        // Excel may return Date objects
        const fmt = (v: unknown) => {
          if (v instanceof Date) return v.toISOString().slice(0, 10)
          return String(v).slice(0, 10)
        }
        return validarFila(String(cedula), String(nombreArchivo), String(turnoNombre), fmt(fi), fmt(ff), empleados, turnos, asignaciones)
      })
      setFilas(parsed)
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const guardarValidos = async () => {
    const validos = filas.filter(f => f.errores.length === 0 && f.empleado && f.turnoObj)
    if (!validos.length) return
    setGuardando(true)
    let ok = 0, err = 0
    for (const f of validos) {
      // Delete conflicting assignments
      if (f.conflicto) {
        await supabase.from('empleado_turnos').delete().eq('id', f.conflicto.id)
      }
      const { error } = await supabase.from('empleado_turnos').insert({
        empleado_id: f.empleado!.id,
        turno_id: f.turnoObj!.id,
        fecha_inicio: f.fechaInicio,
        fecha_fin: f.fechaFin,
      })
      if (error) err++; else ok++
    }
    setResultado({ ok, err })
    setFilas([])
    cargar()
    setGuardando(false)
  }

  // Manual edit handlers
  const abrirEditar = (idx: number) => { setEditIdx(idx); setEditFila({ ...filas[idx] }) }
  const cerrarEditar = () => { setEditIdx(null); setEditFila(null) }
  const guardarEdicion = () => {
    if (!editFila || editIdx === null) return
    const revalidada = validarFila(
      editFila.cedula, editFila.nombreArchivo, editFila.turno,
      editFila.fechaInicio, editFila.fechaFin, empleados, turnos, asignaciones
    )
    const nuevas = [...filas]
    nuevas[editIdx] = revalidada
    setFilas(nuevas)
    cerrarEditar()
  }
  const eliminarFila = (idx: number) => setFilas(f => f.filter((_, i) => i !== idx))

  const validos = filas.filter(f => f.errores.length === 0)
  const conError = filas.filter(f => f.errores.length > 0)

  // Current assignments table
  const [mostrarAsig, setMostrarAsig] = useState(false)

  const eliminarAsig = async (id: string) => {
    await supabase.from('empleado_turnos').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="space-y-5">
      {/* Step 1: download template */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">Paso 1 · Descarga la plantilla Excel</p>
        <p className="text-xs text-gray-500">
          La plantilla incluye todos los empleados activos pre-cargados y una hoja con los turnos disponibles.
          Llena la columna "Turno", "Fecha Inicio" y "Fecha Fin" y guarda el archivo.
        </p>
        <button
          onClick={descargarPlantilla}
          className="flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition"
        >
          <Download size={15} /> Descargar plantilla (.xlsx)
        </button>
      </div>

      {/* Step 2: upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">Paso 2 · Sube el archivo completado</p>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={procesarArchivo} className="hidden" />
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
        >
          <Upload size={15} /> Seleccionar archivo Excel
        </button>
      </div>

      {/* Result */}
      {resultado && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${resultado.err === 0 ? 'bg-brand-50 text-brand-700' : 'bg-yellow-50 text-yellow-700'}`}>
          <CheckCircle2 size={16} />
          {resultado.ok} asignaciones guardadas{resultado.err > 0 ? `, ${resultado.err} con error` : ' correctamente.'}
        </div>
      )}

      {/* Preview table */}
      {filas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">
              Vista previa · {validos.length} válidas · {conError.length} con error
            </p>
            <button
              onClick={guardarValidos}
              disabled={guardando || validos.length === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Save size={14} /> {guardando ? 'Guardando...' : `Aplicar ${validos.length} válidas`}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Estado</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Cédula</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Empleado</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Turno</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Período</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Notas</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filas.map((f, idx) => (
                    <tr key={idx} className={f.errores.length > 0 ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2.5">
                        {f.errores.length > 0
                          ? <XCircle size={15} className="text-red-500" />
                          : f.advertencias.length > 0
                          ? <AlertTriangle size={15} className="text-amber-500" />
                          : <CheckCircle2 size={15} className="text-brand-500" />}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-700">{f.cedula}</td>
                      <td className="px-3 py-2.5 text-gray-700">{f.empleado?.nombre ?? f.nombreArchivo}</td>
                      <td className="px-3 py-2.5">
                        {f.turnoObj
                          ? <span className="text-brand-700 font-semibold">{f.turnoObj.nombre}</span>
                          : <span className="text-red-500">{f.turno || '—'}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{f.fechaInicio} → {f.fechaFin}</td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        {f.errores.map((e, i) => (
                          <p key={i} className="text-red-600 font-medium">{e}</p>
                        ))}
                        {f.advertencias.map((a, i) => (
                          <p key={i} className="text-amber-600">{a}</p>
                        ))}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirEditar(idx)} className="p-1 rounded text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => eliminarFila(idx)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editIdx !== null && editFila && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={cerrarEditar}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Editar fila</h3>
              <button onClick={cerrarEditar} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              <input value={editFila.cedula} onChange={e => setEditFila(f => ({ ...f!, cedula: e.target.value }))}
                placeholder="Cédula" className={`${INPUT} w-full`} />
              <select value={editFila.turno} onChange={e => setEditFila(f => ({ ...f!, turno: e.target.value }))}
                className={`${INPUT} w-full`}>
                <option value="">Seleccionar turno...</option>
                {turnos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                  <input type="date" value={editFila.fechaInicio}
                    onChange={e => setEditFila(f => ({ ...f!, fechaInicio: e.target.value }))}
                    className={`${INPUT} w-full`} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Fecha fin</label>
                  <input type="date" value={editFila.fechaFin}
                    onChange={e => setEditFila(f => ({ ...f!, fechaFin: e.target.value }))}
                    className={`${INPUT} w-full`} />
                </div>
              </div>
            </div>
            <button onClick={guardarEdicion}
              className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition">
              Revalidar y aplicar
            </button>
          </div>
        </div>
      )}

      {/* Current assignments */}
      <div>
        <button
          onClick={() => setMostrarAsig(v => !v)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
        >
          {mostrarAsig ? '▲' : '▼'} Ver asignaciones vigentes ({asignaciones.length})
        </button>
        {mostrarAsig && (
          <div className="mt-3 bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {asignaciones.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin asignaciones vigentes.</p>
            ) : asignaciones.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {empleados.find(e => e.id === a.empleado_id)?.nombre ?? a.empleado_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(a as any).turno?.nombre ?? a.turno_id} · {a.fecha_inicio} → {a.fecha_fin}
                  </p>
                </div>
                <button onClick={() => eliminarAsig(a.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
