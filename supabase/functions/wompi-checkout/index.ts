const PUBLIC_KEY = Deno.env.get('WOMPI_PUBLIC_KEY') ?? ''
const INTEGRITY_SECRET = Deno.env.get('WOMPI_INTEGRITY_SECRET') ?? ''

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { reference, amountInCents, redirectUrl } = await req.json()
  if (!reference || !amountInCents || !redirectUrl) {
    return new Response(JSON.stringify({ error: 'Parámetros incompletos' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const firma = await sha256(`${reference}${amountInCents}COP${INTEGRITY_SECRET}`)
  const params = new URLSearchParams({
    'public-key': PUBLIC_KEY,
    'currency': 'COP',
    'amount-in-cents': String(amountInCents),
    'reference': reference,
    'signature:integrity': firma,
    'redirect-url': redirectUrl,
  })

  return new Response(
    JSON.stringify({ url: `https://checkout.wompi.co/p/?${params.toString()}` }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } }
  )
})
