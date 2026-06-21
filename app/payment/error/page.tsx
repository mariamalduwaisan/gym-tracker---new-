import Link from 'next/link'

export default function PaymentError() {
  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
      {/* Ring — red */}
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
        }}>
          ✕
        </div>
      </div>

      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
        Payment Failed
      </h1>
      <p style={{ color: '#636366', fontSize: 15, lineHeight: 1.55, maxWidth: 300, marginBottom: 36 }}>
        Your payment was cancelled or could not be processed. No charges were made.
      </p>

      {/* Info card */}
      <div style={{
        background: '#1c1c1e', borderRadius: 20,
        padding: '18px 24px', marginBottom: 36,
        border: '1px solid #2c2c2e',
        maxWidth: 320, width: '100%',
        textAlign: 'left',
      }}>
        <p style={{ color: '#8e8e93', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          What happened?
        </p>
        {[
          'Payment was cancelled by you',
          'Card was declined by your bank',
          'Session timed out',
        ].map((reason, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
            <span style={{ color: '#FF375F', fontSize: 13, marginTop: 1, flexShrink: 0 }}>•</span>
            <p style={{ color: '#636366', fontSize: 13, lineHeight: 1.4 }}>{reason}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
        <Link href="/" style={{
          flex: 1, padding: '14px 0', borderRadius: 14, textAlign: 'center',
          background: '#1c1c1e', color: '#8e8e93',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          border: '1px solid #2c2c2e',
        }}>
          Dashboard
        </Link>
        <Link href="/#sessions" style={{
          flex: 2, padding: '14px 0', borderRadius: 14, textAlign: 'center',
          background: '#A5F044', color: '#000',
          fontSize: 14, fontWeight: 800, textDecoration: 'none',
        }}>
          Try Again →
        </Link>
      </div>
    </div>
  )
}
