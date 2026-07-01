import { supabase } from './supabase'

const IS_TEST = (import.meta.env.VITE_WOMPI_PUBLIC_KEY as string)?.startsWith('pub_test_')
const WOMPI_API = IS_TEST ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1'

// Genera la URL de checkout llamando al Edge Function (el secreto nunca sale del servidor)
export async function urlCheckout(reference: string, amountInCents: number, redirectUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wompi-checkout', {
    body: { reference, amountInCents, redirectUrl },
  })
  if (error || !data?.url) throw new Error('No se pudo generar el enlace de pago')
  return data.url as string
}

export async function verificarTransaccion(transactionId: string): Promise<{ status: string; amountInCents: number } | null> {
  try {
    const res = await fetch(`${WOMPI_API}/transactions/${transactionId}`)
    if (!res.ok) return null
    const json = await res.json()
    return { status: json.data.status, amountInCents: json.data.amount_in_cents }
  } catch {
    return null
  }
}
