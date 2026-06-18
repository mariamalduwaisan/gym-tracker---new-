'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Workout, ProgressMetric, Priority, Status } from '@/lib/types'
import ActivityRings      from '@/components/ActivityRings'
import NotificationBanner from '@/components/NotificationBanner'
import WorkoutCard        from '@/components/WorkoutCard'
import AddWorkoutModal    from '@/components/AddWorkoutModal'
import LogExerciseModal   from '@/components/LogExerciseModal'
import ProgressTab        from '@/components/ProgressTab'
import Nav                from '@/components/Nav'
import AuthScreen         from '@/components/AuthScreen'

type Tab            = 'dashboard' | 'workouts' | 'progress'
type PriorityFilter = 'all' | Priority
type StatusFilter   = 'all' | Status

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

const PC: Record<string, string> = {
  all: '#636366', urgent: '#FF375F', high: '#FF9F0A', medium: '#30D158', low: '#636366',
}
const SC: Record<string, string> = {
  all: '#636366', pending: '#636366', in_progress: '#FF9F0A', completed: '#30D158',
}

export default function App() {
  const [session,        setSession]       = useState<Session | null | undefined>(undefined)
  const [tab,            setTab]           = useState<Tab>('dashboard')
  const [workouts,       setWorkouts]      = useState<Workout[]>([])
  const [metrics,        setMetrics]       = useState<ProgressMetric[]>([])
  const [loading,        setLoading]       = useState(true)
  const [priorityFilter, setPriorityFilter]= useState<PriorityFilter>('all')
  const [statusFilter,   setStatusFilter]  = useState<StatusFilter>('all')
  const [showAddModal,   setShowAddModal]  = useState(false)
  const [logWorkout,     setLogWorkout]    = useState<Workout | null>(null)

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    const [wRes, mRes] = await Promise.all([
      fetch('/api/workouts'),
      fetch('/api/progress'),
    ])
    const [ws, ms] = await Promise.all([wRes.json(), mRes.json()])
    setWorkouts(Array.isArray(ws) ? ws : [])
    setMetrics(Array.isArray(ms) ? ms : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Ring computations ─────────────────────────────────────────────
  const today         = new Date().toISOString().split('T')[0]
  const todayWorkouts = workouts.filter(w => w.scheduled_date === today)
  const completedToday= todayWorkouts.filter(w => w.status === 'completed').length
  const moveRing      = todayWorkouts.length > 0 ? completedToday / todayWorkouts.length : 0

  const totalCompleted = workouts.filter(w => w.status === 'completed').length
  const exerciseRing   = workouts.length > 0 ? Math.min(totalCompleted / workouts.length, 1) : 0

  const sortedMetrics  = [...metrics].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const firstMetric    = sortedMetrics[0]
  const latestMetric   = sortedMetrics[sortedMetrics.length - 1]
  const weightLost     = (firstMetric?.weight_kg && latestMetric?.weight_kg)
    ? Math.max(0, firstMetric.weight_kg - latestMetric.weight_kg)
    : 0
  const standRing      = Math.min(weightLost / 10, 1)

  // ── Notifications ─────────────────────────────────────────────────
  const urgentPending  = workouts.filter(w =>
    (w.priority === 'urgent' || w.priority === 'high') && w.status !== 'completed'
  )
  const urgentCount    = workouts.filter(w => w.priority === 'urgent' && w.status !== 'completed').length

  // ── Filtered list ─────────────────────────────────────────────────
  const filtered = workouts
    .filter(w => priorityFilter === 'all' || w.priority === priorityFilter)
    .filter(w => statusFilter   === 'all' || w.status   === statusFilter)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  function updateWorkout(updated: Workout) {
    setWorkouts(prev => prev.map(w => w.id === updated.id ? updated : w))
  }
  function deleteWorkout(id: string) {
    setWorkouts(prev => prev.filter(w => w.id !== id))
  }

  // ── Shared filter chips ────────────────────────────────────────────
  const PRIORITIES: PriorityFilter[] = ['all', 'urgent', 'high', 'medium', 'low']
  const STATUSES:   StatusFilter[]   = ['all', 'pending', 'in_progress', 'completed']

  function chip(
    value: string,
    active: string,
    color: string,
    onClick: () => void,
    label: string
  ) {
    const isActive = value === active
    return (
      <button
        key={value}
        onClick={onClick}
        style={{
          padding: '8px 16px', borderRadius: 100, border: 'none',
          background: isActive ? `${color}22` : '#1c1c1e',
          color:      isActive ? color         : '#636366',
          fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.05em',
          outline: isActive ? `1.5px solid ${color}55` : 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {label}
      </button>
    )
  }

  // Show nothing while session is being resolved
  if (session === undefined) return null

  // Not logged in → show auth screen
  if (!session) return <AuthScreen />

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 88 }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header style={{ padding: '28px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#3a3a3c', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Your Journey
          </p>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, lineHeight: 1.15, marginTop: 3 }}>
            Transformation<br />Journey
          </h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
          {urgentPending.length > 0 && (
            <div style={{
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(255,55,95,.14)',
              border: '1px solid rgba(255,55,95,.28)',
              color: '#FF375F', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#FF375F',
                display: 'inline-block',
                animation: 'pulse-dot 1.6s ease infinite',
              }} />
              {urgentPending.length} urgent
            </div>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '6px 14px', borderRadius: 100, border: 'none',
              background: '#1c1c1e', color: '#636366',
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.06em',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Loading skeleton ─────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {/* ══════════════ DASHBOARD TAB ══════════════ */}
      {!loading && tab === 'dashboard' && (
        <>
          {/* Notifications */}
          <NotificationBanner workouts={urgentPending} />

          {/* Activity rings */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <ActivityRings move={moveRing} exercise={exerciseRing} stand={standRing} size={224} />
          </div>

          {/* Ring legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, padding: '4px 20px 20px' }}>
            {[
              { color: '#FF375F', label: 'Move',     sub: `${completedToday}/${todayWorkouts.length} today` },
              { color: '#A5F044', label: 'Exercise',  sub: `${totalCompleted} completed` },
              { color: '#00D9FF', label: 'Stand',     sub: `${weightLost.toFixed(1)} kg lost` },
            ].map(r => (
              <div key={r.label} style={{ textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, boxShadow: `0 0 7px ${r.color}`, margin: '0 auto 4px' }} />
                <p style={{ color: r.color, fontSize: 11, fontWeight: 700 }}>{r.label}</p>
                <p style={{ color: '#636366', fontSize: 10, marginTop: 1 }}>{r.sub}</p>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '0 16px', marginBottom: 24 }}>
            {[
              { label: 'Total',     value: workouts.length,                                              color: '#fff'     },
              { label: 'Done',      value: totalCompleted,                                               color: '#30D158'  },
              { label: 'Urgent',    value: urgentCount,                                                  color: '#FF375F'  },
            ].map(s => (
              <div key={s.label} style={{ background: '#1c1c1e', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
                <p style={{ color: s.color, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: '#636366', fontSize: 10, marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Today's workouts */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: '#8e8e93', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Today&apos;s Workouts
              </p>
              <button
                onClick={() => setTab('workouts')}
                style={{ color: '#00D9FF', fontSize: 13, fontWeight: 600, background: 'none', border: 'none' }}
              >
                See all →
              </button>
            </div>

            {todayWorkouts.length === 0 ? (
              <div style={{ background: '#1c1c1e', borderRadius: 20, padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: 40, marginBottom: 10 }}>⌚</p>
                <p style={{ color: '#636366', fontSize: 14 }}>No workouts scheduled for today.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    marginTop: 16, padding: '10px 28px', borderRadius: 100,
                    background: '#A5F044', color: '#000',
                    fontSize: 14, fontWeight: 700, border: 'none',
                  }}
                >
                  + Schedule a Workout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayWorkouts.map(w => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    onUpdate={updateWorkout}
                    onDelete={deleteWorkout}
                    onLog={setLogWorkout}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════ WORKOUTS TAB ══════════════ */}
      {!loading && tab === 'workouts' && (
        <>
          {/* Priority filter */}
          <div style={{ padding: '0 16px 10px' }}>
            <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
              Priority
            </p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {PRIORITIES.map(p => chip(
                p, priorityFilter, PC[p],
                () => setPriorityFilter(p),
                p === 'all' ? 'All' : p
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ color: '#8e8e93', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
              Status
            </p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {STATUSES.map(s => chip(
                s, statusFilter, SC[s],
                () => setStatusFilter(s),
                s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
              ))}
            </div>
          </div>

          {/* Count */}
          <div style={{ padding: '0 16px', marginBottom: 10 }}>
            <p style={{ color: '#3a3a3c', fontSize: 13 }}>
              {filtered.length} workout{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* List */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ background: '#1c1c1e', borderRadius: 20, padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: 40, marginBottom: 10 }}>🏋️</p>
                <p style={{ color: '#636366', fontSize: 14 }}>No workouts match this filter.</p>
              </div>
            ) : filtered.map(w => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onUpdate={updateWorkout}
                onDelete={deleteWorkout}
                onLog={setLogWorkout}
              />
            ))}
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              position: 'fixed', bottom: 76, right: 20, zIndex: 40,
              width: 56, height: 56, borderRadius: '50%',
              background: '#A5F044', color: '#000',
              fontSize: 30, fontWeight: 700, border: 'none',
              boxShadow: '0 4px 24px rgba(165,240,68,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            +
          </button>
        </>
      )}

      {/* ══════════════ PROGRESS TAB ══════════════ */}
      {!loading && tab === 'progress' && (
        <div style={{ padding: '0 16px' }}>
          <ProgressTab
            metrics={metrics}
            onAdded={m => setMetrics(prev => [...prev, m])}
          />
        </div>
      )}

      {/* ── Bottom nav ───────────────────────────────────────────── */}
      <Nav active={tab} onChange={setTab} urgentCount={urgentCount} />

      {/* ── Modals ───────────────────────────────────────────────── */}
      {showAddModal && (
        <AddWorkoutModal
          onClose={() => setShowAddModal(false)}
          onCreated={w => {
            setWorkouts(prev => [w, ...prev])
            setShowAddModal(false)
          }}
        />
      )}
      {logWorkout && (
        <LogExerciseModal
          workout={logWorkout}
          onClose={() => setLogWorkout(null)}
        />
      )}
    </div>
  )
}
