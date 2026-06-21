import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/myfatoorah'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ status: 'unknown' })

  try {
    const status = await getPaymentStatus(paymentId)
    return NextResponse.json({ status, paid: status === 'Paid' })
  } catch {
    return NextResponse.json({ status: 'unknown', paid: false })
  }
}
