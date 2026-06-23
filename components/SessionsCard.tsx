'use client'

import { useState, useRef } from 'react'
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

interface CartItem { sessions: number; price: number; label: string }

export default function SessionsCard() {
  const [cart,     setCart]     = useState<CartItem | null>(null)
  const [methodId, setMethodId] = useState(2)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const cartRef = useRef<HTMLDivElement>(null)

  function addToCart(pkg: CartItem) {
    setError('')
    const isNew = cart?.sessions !== pkg.sessions
    setCart(prev => prev?.sessions === pkg.sessions ? null : pkg)
    if (isNew) {
      setTimeout(() => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
    }
  }

  async function handleCheckout() {
    if (!cart) return
    setError('')
    setLoading(true)
    try {
      const res  = await authedFetch('https://ohgomlhudekqmnmhhnic.supabase.co/functions/v1/initiate-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionsCount: cart.sessions, paymentMethodId: methodId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to start payment'); setLoading(false); return }
      window.location.href = data.paymentUrl
    } catch {
      setError('Payment gateway unavailable. Please try again later.')
      setLoading(false)
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

      {/* Packages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: cart ? 14 : 0 }}>
        {PACKAGES.map(pkg => {
          const inCart = cart?.sessions === pkg.sessions

          return (
            <div
              key={pkg.sessions}
              style={{
                background:   '#1c1c1e',
                borderRadius: 18,
                padding:      '16px 18px',
                border: inCart
                  ? '1.5px solid #A5F044'
                  : pkg.badge === 'Most Popular'
                    ? '1.5px solid #A5F04440'
                    : '1px solid #2c2c2e',
                boxShadow: inCart
                  ? '0 0 20px #A5F04420'
                  : pkg.badge === 'Most Popular'
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
                onClick={() => addToCart(pkg)}
                style={{
                  padding:      '11px 18px',
                  borderRadius: 12,
                  border:       inCart ? 'none' : '1px solid #3a3a3c',
                  background:   inCart ? '#A5F044' : 'transparent',
                  color:        inCart ? '#000'    : '#8e8e93',
                  fontSize:     13,
                  fontWeight:   700,
                  flexShrink:   0,
                  minWidth:     90,
                  letterSpacing: '.01em',
                }}
              >
                {inCart ? '✓ Added' : 'Add to Cart'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Cart */}
      {cart && (
        <div ref={cartRef} style={{
          background: '#1c1c1e',
          borderRadius: 18,
          border: '1.5px solid #A5F04460',
          padding: '16px 18px',
          marginTop: 4,
        }}>
          <p style={{ color: '#8e8e93', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
            Your Cart
          </p>

          {/* Selected item */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{cart.sessions} Sessions</p>
              <p style={{ color: '#636366', fontSize: 12 }}>{cart.label} package</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#A5F044', fontSize: 18, fontWeight: 800 }}>{cart.price} KWD</p>
              <button
                onClick={() => setCart(null)}
                style={{ color: '#636366', fontSize: 11, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#2c2c2e', marginBottom: 14 }} />

          {/* Payment method */}
          <p style={{ color: '#636366', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Payment Method</p>
          <div style={{
            display: 'flex', gap: 8, marginBottom: 14,
            background: '#111', borderRadius: 10, padding: 4,
          }}>
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                  background: methodId === m.id ? '#A5F044' : 'transparent',
                  color:      methodId === m.id ? '#000'    : '#636366',
                  fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 13, border: 'none',
              background: loading ? '#2c2c2e' : '#A5F044',
              color:      loading ? '#636366' : '#000',
              fontSize: 15, fontWeight: 800, letterSpacing: '.01em',
            }}
          >
            {loading ? 'Redirecting…' : `Checkout · ${cart.price} KWD`}
          </button>
        </div>
      )}

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
