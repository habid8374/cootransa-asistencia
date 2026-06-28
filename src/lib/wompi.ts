const PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY as string
const INTEGRITY_SECRET = import.meta.env.VITE_WOMPI_INTEGRITY_SECRET as string
const IS_TEST = PUBLIC_KEY?.startsWith('pub_test_')
const WOMPI_API = IS_TEST ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1'

export async function firmaIntegridad(reference: string, amountInCents: number): Promise<string> {
  const text = `${reference}${amountInCents}COP${INTEGRITY_SECRET}`
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function urlCheckout(reference: string, amountInCents: number, redirectUrl: string): Promise<string> {
  const firma = await firmaIntegridad(reference, amountInCents)
  const params = new URLSearchParams({
    'public-key': PUBLIC_KEY,
    'currency': 'COP',
    'amount-in-cents': String(amountInCents),
    'reference': reference,
    'signature:integrity': firma,
    'redirect-url': redirectUrl,
  })
  return `https://checkout.wompi.co/p/?${params.toString()}`
}

export async function verificarTransaccion(transactionId: string): Promise<{ status: string; amountInCents: number; reference: string } | null> {
  try {
    const res = await fetch(`${WOMPI_API}/transactions/${transactionId}`)
    if (!res.ok) return null
    const json = await res.json()
    return {
      status: json.data.status,
      amountInCents: json.data.amount_in_cents,
      reference: json.data.reference,
    }
  } catch {
    return null
  }
}

// Verifica la firma que Wompi envía en la URL de retorno.
// Wompi computa: SHA-256(transactionId + status + currency + amountInCents + INTEGRITY_SECRET)
export async function verificarFirmaRetorno(
  transactionId: string,
  status: string,
  currency: string,
  amountInCents: number,
  firmaRecibida: string
): Promise<boolean> {
  const text = `${transactionId}${status}${currency}${amountInCents}${INTEGRITY_SECRET}`
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const computed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === firmaRecibida
}
