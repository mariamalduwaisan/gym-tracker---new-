'use client'

import { useState } from 'react'
import { authedFetch } from '@/lib/supabase'

const PACKAGES = [
  { sessions: 10, price: 100, label: 'Starter'   },
  { sessions: 20, price: 200, label: 'Popular',   badge: 'Most Popular' },
  { sessions: 30, price: 300, label: 'Committed', badge: 'Best Value'   },
]

const METHODS = [
  { id: 2, label: 'Visa / Master', icon: '💳' },
  { id: 1, label: 'KNET',         icon: '🏦' },
]

export default function SessionsCard() {
  const [methodId, setMethodId] = useState(2)
  const [loading,  setLoading]  = useState<number | null>(null)
  const [error,    setError]    = useState('')

  async function handleBuy(sessionsCount: number) {
    setError('')
    setLoading(sessionsCount)
    try {
      const res  = await authedFetch('/api/purchase/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionsCount, paymentMethodId: methodId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to start payment'); setLoading(null); return }
      window.location.href = data.paymentUrl
    } catch {
      setError('Payment gateway unavailable. Please try again later.')
      setLoading(null)
    }
  }

  return (
    <div style={{ padding: '0 16px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <p style={{ color: '#8e8e93', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Session Packages
        </p>
        <p style={{ color: '#3a3a3c', fontSize: 11 }}>10 KWD / session</p>
      </div>

      {/* Payment method toggle */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 14,
        background: '#1c1c1e', borderRadius: 12, padding: 4,
        border: '1px solid #2c2c2e',
      }}>
        {METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => setMethodId(m.id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
              background: methodId === m.id ? '#A5F044' : 'transparent',
              color:      methodId === m.id ? '#000'     : '#636366',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {/* Packages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PACKAGES.map(pkg => {
          const isLoading  = loading === pkg.sessions
          const isDisabled = loading !== null

          return (
            <div
              key={pkg.sessions}
              style={{
                background:   '#1c1c1e',
                borderRadius: 18,
                padding:      '16px 18px',
                border: pkg.badge === 'Most Popular'
                  ? '1.5px solid #A5F04440'
                  : '1px solid #2c2c2e',
                boxShadow: pkg.badge === 'Most Popular'
                  ? '0 0 24px #A5F04412'
                  : undefined,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                gap:            12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                    {pkg.sessions} Sessions
                  </span>
                  {pkg.badge && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      background: pkg.badge === 'Best Value' ? '#00D9FF18' : '#A5F04420',
                      color:      pkg.badge === 'Best Value' ? '#00D9FF'   : '#A5F044',
                      fontSize: 9, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '.1em',
                    }}>
                      {pkg.badge}
                    </span>
                  )}
                </div>
                <p style={{ color: '#636366', fontSize: 12 }}>
                  {pkg.price} KWD · {pkg.sessions} training sessions
                </p>
              </div>

              <button
                onClick={() => handleBuy(pkg.sessions)}
                disabled={isDisabled}
                style={{
                  padding:      '11px 20px',
                  borderRadius: 12,
                  border:       'none',
                  background:   isLoading ? '#2c2c2e' : '#A5F044',
                  color:        isLoading ? '#8e8e93' : '#000',
                  fontSize:     14,
                  fontWeight:   800,
                  flexShrink:   0,
                  minWidth:     90,
                  opacity:      isDisabled && !isLoading ? 0.4 : 1,
                  letterSpacing: '.01em',
                }}
              >
                {isLoading ? '…' : `${pkg.price} KWD`}
              </button>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{
          marginTop: 10, padding: '10px 14px', borderRadius: 12,
          background: 'rgba(255,55,95,.1)', border: '1px solid rgba(255,55,95,.25)',
          color: '#FF375F', fontSize: 13,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
