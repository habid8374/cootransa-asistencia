import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const INTEGRITY_SECRET = Deno.env.get('WOMPI_INTEGRITY_SECRET') ?? ''

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const tx = (body.data as Record<string, unknown>)?.transaction as Record<string, unknown>
  const checksum = (body.signature as Record<string, unknown>)?.checksum as string
  const properties = (body.signature as Record<string, unknown>)?.properties as string[]

  if (!tx || !checksum || !Array.isArray(properties)) {
    return new Response('Invalid payload', { status: 400 })
  }

  // Verificar firma de Wompi
  // SHA-256(prop1value + prop2value + ... + INTEGRITY_SECRET)
  const valores = properties.map(prop => {
    const keys = prop.split('.')
    let val: unknown = body.data
    for (const k of keys) val = (val as Record<string, unknown>)?.[k]
    return String(val ?? '')
  })
  const computed = await sha256(valores.join('') + INTEGRITY_SECRET)

  if (computed !== checksum) {
    console.error('Firma inválida', { computed, checksum })
    return new Response('Firma inválida', { status: 401 })
  }

  const status = tx.status as string
  const tiqueteId = tx.reference as string
  const wompiTxId = tx.id as string

  // Solo procesar pagos aprobados
  if (status !== 'APPROVED') {
    console.log(`Evento ignorado: status=${status} reference=${tiqueteId}`)
    return new Response('OK', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabase
    .from('tiquetes')
    .update({ estado: 'confirmado', referencia_pago: wompiTxId })
    .eq('id', tiqueteId)
    .eq('estado', 'pendiente') // solo si aún está pendiente

  if (error) {
    console.error('Error al confirmar tiquete:', error)
    return new Response('Error de base de datos', { status: 500 })
  }

  console.log(`Tiquete confirmado: ${tiqueteId} → tx ${wompiTxId}`)
  return new Response('OK', { status: 200 })
})
