import Link from 'next/link'
import { getPaymentStatus } from '@/lib/myfatoorah'

interface Props {
  searchParams: Promise<{ paymentId?: string; Id?: string }>
}

export default async function PaymentSuccess({ searchParams }: Props) {
  const params    = await searchParams
  const paymentId = params.paymentId ?? params.Id ?? null

  let paid = true // MyFatoorah only calls CallBackUrl on success, so default to true
  if (paymentId) {
    try {
      const status = await getPaymentStatus(paymentId)
      paid = status === 'Paid'
    } catch {
      // leave paid = true — trust MyFatoorah's redirect
    }
  }

  if (!paid) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(255,55,95,.12)',
          border: '2px solid rgba(255,55,95,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, marginBottom: 28,
        }}>✕</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
          Payment Not Confirmed
        </h1>
        <p style={{ color: '#636366', fontSize: 15, marginBottom: 36, maxWidth: 300, lineHeight: 1.55 }}>
          We couldn&apos;t verify your payment. Please contact support if you were charged.
        </p>
        <Link href="/" style={{
          padding: '14px 36px', borderRadius: 14,
          background: '#1c1c1e', color: '#fff',
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
          border: '1px solid #2c2c2e',
        }}>
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
      {/* Animated ring */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
        <svg viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#A5F04420" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke="#A5F044" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset="0"
            transform="rotate(-90 60 60)"
            style={{ filter: 'drop-shadow(0 0 8px #A5F044)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          ✓
        </div>
      </div>

      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
        Payment Successful!
      </h1>
      <p style={{ color: '#636366', fontSize: 15, marginBottom: 8, lineHeight: 1.55, maxWidth: 300 }}>
        Your sessions are confirmed. Time to crush your goals.
      </p>
      {paymentId && (
        <p style={{ color: '#3a3a3c', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', marginBottom: 36 }}>
          REF: {paymentId}
        </p>
      )}

      {/* Stats strip */}
      <div style={{
        background: '#1c1c1e', borderRadius: 20,
        padding: '18px 28px', marginBottom: 36,
        display: 'flex', gap: 32,
        border: '1px solid #2c2c2e',
      }}>
        {[
          { icon: '💪', label: 'Sessions', value: 'Ready' },
          { icon: '🏋️', label: 'Status',   value: 'Active' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</p>
            <p style={{ color: '#A5F044', fontSize: 15, fontWeight: 700 }}>{s.value}</p>
            <p style={{ color: '#636366', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <Link href="/" style={{
        padding: '15px 44px', borderRadius: 14,
        background: '#A5F044', color: '#000',
        fontSize: 16, fontWeight: 800, textDecoration: 'none',
        letterSpacing: '.01em',
      }}>
        Let&apos;s Go →
      </Link>
    </div>
  )
}
