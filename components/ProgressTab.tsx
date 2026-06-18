'use client'

import { useState } from 'react'
import { ProgressMetric } from '@/lib/types'
import { authedFetch } from '@/lib/supabase'

interface Props {
  metrics: ProgressMetric[]
  onAdded: (m: ProgressMetric) => void
}

export default function ProgressTab({ metrics, onAdded }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [weight,   setWeight]   = useState('')
  const [bodyFat,  setBodyFat]  = useState('')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const sorted = [...metrics].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const latest   = sorted[sorted.length - 1]
  const first    = sorted[0]
  const lostKg   = (first?.weight_kg && latest?.weight_kg)
    ? Math.max(0, first.weight_kg - latest.weight_kg)
    : 0

  async function logMetric(e: React.FormEvent) {
    e.preventDefault()
    if (!weight && !bodyFat) return
    setSaving(true)
    const res = await authedFetch('/api/progress', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_kg:    weight  ? parseFloat(weight)  : null,
        body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
        notes:        notes || null,
        recorded_at:  new Date().toISOString().split('T')[0],
      }),
    })
    if (res.ok) {
      onAdded(await res.json())
      setWeight(''); setBodyFat(''); setNotes('')
      setShowForm(false)
    }
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#2c2c2e', border: '1px solid #3a3a3c',
    borderRadius: 12, color: '#fff', fontSize: 15,
  }
  const lbl: React.CSSProperties = {
    color: '#8e8e93', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.08em',
    display: 'block', marginBottom: 6,
  }

  // Simple SVG line chart
  function WeightChart() {
    const pts = sorted.filter(m => m.weight_kg != null)
    if (pts.length < 2) return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <p style={{ fontSize: 36, marginBottom: 8 }}>📊</p>
        <p style={{ color: '#636366', fontSize: 14 }}>Log at least 2 weights to see your chart.</p>
      </div>
    )

    const W = 320, H = 130
    const vals   = pts.map(p => p.weight_kg!)
    const minV   = Math.min(...vals) - 1
    const maxV   = Math.max(...vals) + 1
    const range  = maxV - minV || 1
    const toX    = (i: number) => (i / (pts.length - 1)) * W
    const toY    = (v: number) => H - ((v - minV) / range) * H
    const pathD  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.weight_kg!).toFixed(1)}`).join(' ')
    const areaD  = `${pathD} L ${toX(pts.length - 1).toFixed(1)} ${H} L 0 ${H} Z`

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#00D9FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wg)" />
        <path d={pathD} fill="none" stroke="#00D9FF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.weight_kg!)} r={4} fill="#00D9FF" />
        ))}
        {/* Y-axis labels */}
        <text x={4} y={10} fill="#636366" fontSize={9}>{maxV.toFixed(1)} kg</text>
        <text x={4} y={H} fill="#636366" fontSize={9}>{minV.toFixed(1)} kg</text>
      </svg>
    )
  }

  return (
    <div>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#1c1c1e', borderRadius: 18, padding: 16 }}>
          <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Current</p>
          <p style={{ color: '#00D9FF', fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
            {latest?.weight_kg?.toFixed(1) ?? '—'}
            <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>kg</span>
          </p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: 18, padding: 16 }}>
          <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Lost</p>
          <p style={{ color: '#A5F044', fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
            {lostKg.toFixed(1)}
            <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>kg</span>
          </p>
        </div>
        {latest?.body_fat_pct != null && (
          <div style={{ background: '#1c1c1e', borderRadius: 18, padding: 16 }}>
            <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Body Fat</p>
            <p style={{ color: '#FF9F0A', fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
              {latest.body_fat_pct.toFixed(1)}
              <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>%</span>
            </p>
          </div>
        )}
        <div style={{ background: '#1c1c1e', borderRadius: 18, padding: 16 }}>
          <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Entries</p>
          <p style={{ color: '#fff', fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>{metrics.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#1c1c1e', borderRadius: 18, padding: '16px 16px 12px', marginBottom: 20 }}>
        <p style={{ color: '#8e8e93', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
          Weight Over Time
        </p>
        <WeightChart />
      </div>

      {/* Log form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: 15, borderRadius: 16,
            background: '#00D9FF18', color: '#00D9FF',
            fontSize: 15, fontWeight: 700,
            border: '1.5px solid #00D9FF28',
          }}
        >
          + Log Progress
        </button>
      ) : (
        <form
          onSubmit={logMetric}
          style={{ background: '#1c1c1e', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Log Progress</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75.5" style={inp} />
            </div>
            <div>
              <label style={lbl}>Body Fat %</label>
              <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="20.0" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="How are you feeling?" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#2c2c2e', color: '#8e8e93', fontSize: 14, fontWeight: 700, border: 'none' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 12, background: '#00D9FF', color: '#000', fontSize: 14, fontWeight: 700, border: 'none', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: '#8e8e93', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            History
          </p>
          <div style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...sorted].reverse().map((m, i, arr) => (
              <div
                key={m.id}
                style={{
                  background: '#1c1c1e',
                  padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: i < arr.length - 1 ? '1px solid #2c2c2e' : 'none',
                }}
              >
                <div>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    {m.weight_kg != null ? `${m.weight_kg} kg` : '—'}
                    {m.body_fat_pct != null && (
                      <span style={{ color: '#FF9F0A', marginLeft: 10, fontSize: 13 }}>{m.body_fat_pct}% BF</span>
                    )}
                  </p>
                  {m.notes && <p style={{ color: '#636366', fontSize: 12, marginTop: 2 }}>{m.notes}</p>}
                </div>
                <p style={{ color: '#636366', fontSize: 12 }}>
                  {new Date(m.recorded_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
