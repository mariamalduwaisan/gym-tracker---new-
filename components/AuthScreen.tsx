'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthScreen() {
  const [mode,     setMode]     = useState<'signin' | 'signup'>('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim() || !password) { setError('Email and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email: email.trim(), password })
      if (err) { setError(err.message) }
      else { setInfo('Account created! Check your email to confirm, or sign in if confirmation is disabled.') }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (err) setError(err.message)
    }
    setLoading(false)
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: '#1c1c1e', border: '1px solid #3a3a3c',
    borderRadius: 14, color: '#fff', fontSize: 16,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo / brand */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'conic-gradient(from 180deg, #FF375F 0%, #A5F044 45%, #00D9FF 75%, #FF375F 100%)',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%',
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24 }}>⌚</span>
          </div>
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
          Transformation<br />Journey
        </h1>
        <p style={{ color: '#636366', fontSize: 14, marginTop: 8 }}>
          Your personal weight-loss mission
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 390,
        background: '#111', borderRadius: 24,
        padding: '28px 24px',
        border: '1px solid #2c2c2e',
      }}>
        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: '#1c1c1e',
          borderRadius: 12, padding: 4, marginBottom: 28,
        }}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setInfo('') }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                background: mode === m ? '#2c2c2e' : 'transparent',
                color: mode === m ? '#fff' : '#636366',
                fontSize: 14, fontWeight: 700,
                transition: 'all .2s',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              color: '#8e8e93', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em',
              display: 'block', marginBottom: 8,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={field}
            />
          </div>

          <div>
            <label style={{
              color: '#8e8e93', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em',
              display: 'block', marginBottom: 8,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={field}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,55,95,.12)', border: '1px solid rgba(255,55,95,.3)',
              borderRadius: 10, padding: '10px 14px',
              color: '#FF375F', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{
              background: 'rgba(165,240,68,.1)', border: '1px solid rgba(165,240,68,.25)',
              borderRadius: 10, padding: '10px 14px',
              color: '#A5F044', fontSize: 13,
            }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: '#A5F044', color: '#000',
              fontSize: 16, fontWeight: 800, border: 'none',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '.02em',
            }}
          >
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ color: '#3a3a3c', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          {mode === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
            style={{ color: '#00D9FF', background: 'none', border: 'none', fontSize: 12, fontWeight: 600 }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
