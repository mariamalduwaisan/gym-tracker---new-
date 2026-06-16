'use client'

import { useState } from 'react'
import { Workout, Status, Priority } from '@/lib/types'

const PC: Record<Priority, string> = {
  urgent: '#FF375F',
  high:   '#FF9F0A',
  medium: '#30D158',
  low:    '#636366',
}

const NEXT_STATUS: Record<Status, Status> = {
  pending:     'in_progress',
  in_progress: 'completed',
  completed:   'pending',
}

const STATUS_LABEL: Record<Status, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Done',
}

const STATUS_COLOR: Record<Status, string> = {
  pending:     '#636366',
  in_progress: '#FF9F0A',
  completed:   '#30D158',
}

interface Props {
  workout:  Workout
  onUpdate: (w: Workout) => void
  onDelete: (id: string) => void
  onLog:    (w: Workout) => void
}

export default function WorkoutCard({ workout, onUpdate, onDelete, onLog }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function cycleStatus() {
    if (loading) return
    setLoading(true)
    const next = NEXT_STATUS[workout.status]
    const res  = await fetch('/api/workouts', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: workout.id, status: next }),
    })
    if (res.ok) onUpdate(await res.json())
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this workout?')) return
    await fetch(`/api/workouts?id=${workout.id}`, { method: 'DELETE' })
    onDelete(workout.id)
  }

  const color = PC[workout.priority]

  return (
    <div style={{
      background:   '#1c1c1e',
      borderRadius: 18,
      overflow:     'hidden',
      border: `1px solid ${workout.priority === 'urgent' ? `${color}40` : '#2c2c2e'}`,
      boxShadow: workout.priority === 'urgent' ? `0 0 20px ${color}18` : undefined,
    }}>
      {/* Cover image */}
      {workout.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workout.image_url}
          alt={workout.title}
          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer',
        }}
      >
        {/* Priority dot */}
        <div style={{
          width: 11, height: 11, borderRadius: '50%',
          background: color,
          boxShadow:  `0 0 7px ${color}`,
          marginTop: 4, flexShrink: 0,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{workout.title}</p>
            <span style={{
              padding: '2px 8px', borderRadius: 100,
              background: `${color}20`, color,
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em',
            }}>
              {workout.priority}
            </span>
          </div>
          {workout.description && (
            <p style={{
              color: '#636366', fontSize: 13, marginTop: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {workout.description}
            </p>
          )}
          <p style={{ color: '#3a3a3c', fontSize: 11, marginTop: 4 }}>
            {new Date(workout.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Status pill */}
        <span style={{
          padding: '4px 10px', borderRadius: 100,
          background: `${STATUS_COLOR[workout.status]}20`,
          color: STATUS_COLOR[workout.status],
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>
          {STATUS_LABEL[workout.status]}
        </span>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #2c2c2e',
          padding:   '12px 16px',
          display:   'flex', gap: 8,
        }}>
          <button
            onClick={cycleStatus}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              background: `${STATUS_COLOR[NEXT_STATUS[workout.status]]}18`,
              color:      STATUS_COLOR[NEXT_STATUS[workout.status]],
              fontSize: 13, fontWeight: 700, border: 'none',
            }}
          >
            {loading ? '…' : `→ ${STATUS_LABEL[NEXT_STATUS[workout.status]]}`}
          </button>
          <button
            onClick={() => onLog(workout)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              background: '#A5F04420', color: '#A5F044',
              fontSize: 13, fontWeight: 700, border: 'none',
            }}
          >
            Log Exercises
          </button>
          <button
            onClick={handleDelete}
            style={{
              width: 42, borderRadius: 12,
              background: '#FF375F18', color: '#FF375F',
              fontSize: 20, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
