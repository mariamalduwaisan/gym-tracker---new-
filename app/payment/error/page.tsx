import Link from 'next/link'

export default function PaymentError() {
  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
        <svg viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF375F20" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none" stroke="#FF375F" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52 * 0.35} ${2 * Math.PI * 52 * 0.65}`}
            transform="rotate(-90 60 60)"
            style={{ filter: 'drop-shadow(0 0 8px #FF375F)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>✕</div>
      </div>

      <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 36 }}>
        Failed
      </h1>

      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/" style={{
          padding: '14px 24px', borderRadius: 14,
          background: '#1c1c1e', color: '#8e8e93',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          border: '1px solid #2c2c2e',
        }}>
          Dashboard
        </Link>
        <Link href="/#sessions" style={{
          padding: '14px 24px', borderRadius: 14,
          background: '#A5F044', color: '#000',
          fontSize: 14, fontWeight: 800, textDecoration: 'none',
        }}>
          Try Again →
        </Link>
      </div>
    </div>
  )
}
