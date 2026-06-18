'use client'

import { useState, useEffect, useCallback } from 'react'
import { Workout, Exercise, ExerciseLog } from '@/lib/types'
import { authedFetch } from '@/lib/supabase'

interface SetEntry {
  set_number: number
  reps:       string
  weight:     string
}

interface Props {
  workout: Workout
  onClose: () => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function LogExerciseModal({ workout, onClose }: Props) {
  const [exercises,        setExercises]        = useState<Exercise[]>([])
  const [logs,             setLogs]             = useState<Record<string, ExerciseLog[]>>({})
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets,             setSets]             = useState<SetEntry[]>([{ set_number: 1, reps: '', weight: '' }])
  const [newExName,        setNewExName]        = useState('')
  const [addingEx,         setAddingEx]         = useState(false)
  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [summary,          setSummary]          = useState<string | null>(null)
  const [summaryLoading,   setSummaryLoading]   = useState(false)

  const fetchLogs = useCallback(async (exerciseId: string) => {
    const res  = await authedFetch(`/api/exercise-logs?exercise_id=${exerciseId}`)
    const data = await res.json()
    setLogs(prev => ({ ...prev, [exerciseId]: data }))
  }, [])

  useEffect(() => {
    async function init() {
      const res  = await authedFetch(`/api/exercises?workout_id=${workout.id}`)
      const data = await res.json()
      setExercises(data)
      if (data.length > 0) {
        setSelectedExercise(data[0])
        await fetchLogs(data[0].id)
      }
      setLoading(false)
    }
    init()
  }, [workout.id, fetchLogs])

  async function addExercise() {
    if (!newExName.trim()) return
    const res = await authedFetch('/api/exercises', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workout_id:    workout.id,
        name:          newExName.trim(),
        target_sets:   3,
        target_reps:   10,
        target_weight: 0,
      }),
    })
    if (res.ok) {
      const ex = await res.json()
      setExercises(prev => [...prev, ex])
      setSelectedExercise(ex)
      setNewExName('')
      setAddingEx(false)
      setSets([{ set_number: 1, reps: '', weight: '' }])
    }
  }

  async function logSets() {
    if (!selectedExercise) return
    const valid = sets.filter(s => s.reps !== '')
    if (valid.length === 0) return
    setSaving(true)
    setSummary(null)

    // Save logs to DB
    await Promise.all(valid.map(s =>
      authedFetch('/api/exercise-logs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: selectedExercise.id,
          set_number:  s.set_number,
          reps:        parseInt(s.reps),
          weight:      parseFloat(s.weight) || 0,
        }),
      })
    ))

    await fetchLogs(selectedExercise.id)
    setSets([{ set_number: 1, reps: '', weight: '' }])
    setSaving(false)

    // Call edge function for motivational summary
    setSummaryLoading(true)
    try {
      const payload = {
        workoutTitle: workout.title,
        exercises: valid.map(s => ({
          name:   selectedExercise.name,
          sets:   1,
          reps:   parseInt(s.reps),
          weight: parseFloat(s.weight) || 0,
        })),
      }
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/workout-summary`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      setSummary(data.summary ?? null)
    } catch {
      setSummary('💪 Great session! Keep pushing — every rep counts.')
    }
    setSummaryLoading(false)
  }

  function selectExercise(ex: Exercise) {
    setSelectedExercise(ex)
    fetchLogs(ex.id)
    setSets([{ set_number: 1, reps: '', weight: '' }])
    setSummary(null)
  }

  const inp: React.CSSProperties = {
    background: '#2c2c2e', border: '1px solid #3a3a3c',
    borderRadius: 10, color: '#fff', fontSize: 15,
    padding: '10px 12px', width: '100%',
  }

  const selectedLogs = selectedExercise ? (logs[selectedExercise.id] || []) : []

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:  '#1c1c1e',
        width: '100%', maxWidth: 430,
        borderRadius: '24px 24px 0 0',
        padding:     '20px 20px 40px',
        maxHeight:   '90vh',
        overflowY:   'auto',
        animation:   'up .3s ease',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 5, borderRadius: 100, background: '#3a3a3c', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Log Exercises</h2>
            <p style={{ color: '#636366', fontSize: 13, marginTop: 2 }}>{workout.title}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#2c2c2e', color: '#8e8e93',
              fontSize: 20, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Exercise selector */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#8e8e93', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                Exercises
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {exercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(ex)}
                    style={{
                      padding: '8px 14px', borderRadius: 100, border: 'none',
                      background: selectedExercise?.id === ex.id ? '#A5F04428' : '#2c2c2e',
                      color:      selectedExercise?.id === ex.id ? '#A5F044'   : '#8e8e93',
                      fontSize: 13, fontWeight: 600,
                      outline: selectedExercise?.id === ex.id ? '1.5px solid #A5F04460' : 'none',
                    }}
                  >
                    {ex.name}
                  </button>
                ))}
                <button
                  onClick={() => setAddingEx(true)}
                  style={{
                    padding: '8px 14px', borderRadius: 100, border: 'none',
                    background: '#2c2c2e', color: '#00D9FF',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Add exercise inline */}
            {addingEx && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  autoFocus
                  value={newExName}
                  onChange={e => setNewExName(e.target.value)}
                  placeholder="Exercise name (e.g. Bench Press)"
                  style={{ ...inp, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && addExercise()}
                />
                <button
                  onClick={addExercise}
                  style={{
                    padding: '0 16px', borderRadius: 10,
                    background: '#A5F044', color: '#000',
                    fontSize: 14, fontWeight: 700, border: 'none',
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Empty state */}
            {exercises.length === 0 && !addingEx && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>💪</p>
                <p style={{ color: '#636366', fontSize: 14 }}>No exercises yet.</p>
                <p style={{ color: '#636366', fontSize: 13, marginTop: 4 }}>Tap &quot;+ Add&quot; to create your first exercise.</p>
              </div>
            )}

            {/* Log sets */}
            {selectedExercise && (
              <div>
                <p style={{ color: '#8e8e93', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                  Log Sets — {selectedExercise.name}
                </p>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#636366', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Set</span>
                  <span style={{ color: '#636366', fontSize: 11, fontWeight: 600 }}>Reps</span>
                  <span style={{ color: '#636366', fontSize: 11, fontWeight: 600 }}>kg</span>
                </div>

                {/* Set rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {sets.map((set, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#2c2c2e', color: '#A5F044',
                        fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {set.set_number}
                      </div>
                      <input
                        type="number" min="0"
                        value={set.reps}
                        onChange={e => setSets(prev => prev.map((s, j) => j === i ? { ...s, reps: e.target.value } : s))}
                        placeholder="10"
                        style={inp}
                      />
                      <input
                        type="number" min="0" step="0.5"
                        value={set.weight}
                        onChange={e => setSets(prev => prev.map((s, j) => j === i ? { ...s, weight: e.target.value } : s))}
                        placeholder="0"
                        style={inp}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSets(prev => [...prev, {
                    set_number: prev.length + 1, reps: '',
                    weight: prev[prev.length - 1]?.weight || '',
                  }])}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 12,
                    background: '#2c2c2e', color: '#8e8e93',
                    fontSize: 13, fontWeight: 600,
                    border: '1px dashed #3a3a3c', marginBottom: 12,
                  }}
                >
                  + Add Set
                </button>

                <button
                  onClick={logSets}
                  disabled={saving || summaryLoading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: '#A5F044', color: '#000',
                    fontSize: 15, fontWeight: 700, border: 'none',
                    opacity: (saving || summaryLoading) ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Log Sets'}
                </button>

                {/* ── Motivational summary ── */}
                {summaryLoading && (
                  <div style={{
                    marginTop: 16,
                    background: '#2c2c2e',
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid #3a3a3c',
                  }}>
                    <div className="spinner" style={{ flexShrink: 0 }} />
                    <p style={{ color: '#8e8e93', fontSize: 13 }}>Getting your motivational summary…</p>
                  </div>
                )}

                {summary && !summaryLoading && (
                  <div style={{
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #1a2a1a 0%, #1c2e1a 100%)',
                    borderRadius: 16,
                    padding: '16px 18px',
                    border: '1px solid #A5F04430',
                    boxShadow: '0 0 20px #A5F04415',
                    animation: 'slide-down .4s cubic-bezier(.4,0,.2,1)',
                  }}>
                    <p style={{
                      color: '#A5F044', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8,
                    }}>
                      ✦ AI Coach
                    </p>
                    <p style={{ color: '#e8f5e8', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                      {summary}
                    </p>
                  </div>
                )}

                {/* Previous logs */}
                {selectedLogs.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ color: '#8e8e93', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                      Previous Logs
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedLogs.slice(0, 12).map(log => (
                        <div
                          key={log.id}
                          style={{
                            background: '#2c2c2e', borderRadius: 10,
                            padding: '10px 14px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#3a3a3c', color: '#A5F044',
                              fontSize: 11, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {log.set_number}
                            </div>
                            <div>
                              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{log.reps} reps</span>
                              {log.weight > 0 && (
                                <span style={{ color: '#8e8e93', fontSize: 13, marginLeft: 8 }}>@ {log.weight} kg</span>
                              )}
                            </div>
                          </div>
                          <span style={{ color: '#636366', fontSize: 11 }}>
                            {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
