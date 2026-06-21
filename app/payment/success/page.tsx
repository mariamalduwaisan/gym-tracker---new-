import Link from 'next/link'

export default function PaymentSuccess() {
  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
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
        }}>✓</div>
      </div>

      <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 36 }}>
        Successful
      </h1>

      <Link href="/" style={{
        padding: '15px 44px', borderRadius: 14,
        background: '#A5F044', color: '#000',
        fontSize: 16, fontWeight: 800, textDecoration: 'none',
      }}>
        Let&apos;s Go →
      </Link>
    </div>
  )
}
