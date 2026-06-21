import { NextRequest, NextResponse } from 'next/server'
import { makeSupabaseClient } from '@/lib/server-client'
import { getFirstPaymentMethod, executePayment } from '@/lib/myfatoorah'

const PACKAGES: Record<number, number> = { 10: 100, 20: 200, 30: 300 }
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const client = makeSupabaseClient(req)
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionsCount } = await req.json()
  const amountKwd = PACKAGES[sessionsCount as number]
  if (!amountKwd) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

  try {
    const paymentMethodId = await getFirstPaymentMethod(amountKwd)
    const reference = `TJ-${sessionsCount}S-${user.id.slice(0, 8)}-${Date.now()}`

    const { invoiceId, paymentUrl } = await executePayment({
      paymentMethodId,
      sessionsCount,
      amountKwd,
      customerEmail: user.email ?? 'customer@example.com',
      customerName:  user.email?.split('@')[0] ?? 'Customer',
      reference,
      callbackUrl: `${SITE_URL}/payment/success`,
      errorUrl:    `${SITE_URL}/payment/error`,
    })

    await client.from('purchases').insert([{
      user_id:           user.id,
      sessions_count:    sessionsCount,
      amount_kwd:        amountKwd,
      invoice_id:        String(invoiceId),
      payment_reference: reference,
      status:            'pending',
    }])

    return NextResponse.json({ paymentUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment initiation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
