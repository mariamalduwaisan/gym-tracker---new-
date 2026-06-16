'use client'

import { useState, useRef } from 'react'
import { Workout, Priority, Status } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  onClose:   () => void
  onCreated: (w: Workout) => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const STATUSES:   Status[]   = ['pending', 'in_progress', 'completed']

const PC: Record<Priority, string> = {
  low: '#636366', medium: '#30D158', high: '#FF9F0A', urgent: '#FF375F',
}
const SC: Record<Status, string> = {
  pending: '#636366', in_progress: '#FF9F0A', completed: '#30D158',
}
const SL: Record<Status, string> = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Done',
}

export default function AddWorkoutModal({ onClose, onCreated }: Props) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState<Priority>('medium')
  const [imageFile,   setImageFile]   = useState<File | null>(null)
  const [imagePreview,setImagePreview]= useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status,      setStatus]      = useState<Status>('pending')
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Title is required')
    setLoading(true)

    // Upload image if selected
    let image_url: string | null = null
    if (imageFile) {
      const ext  = imageFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('workout-images')
        .upload(path, imageFile, { upsert: true })
      if (upErr) { setError('Image upload failed: ' + upErr.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('workout-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const res = await fetch('/api/workouts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:          title.trim(),
        description:    description.trim() || null,
        priority,
        status,
        scheduled_date: date,
        image_url,
      }),
    })
    if (res.ok) {
      onCreated(await res.json())
      onClose()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create workout')
      setLoading(false)
    }
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#2c2c2e', border: '1px solid #3a3a3c',
    borderRadius: 12, color: '#fff', fontSize: 15,
  }

  const label: React.CSSProperties = {
    color: '#8e8e93', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.08em',
    display: 'block', marginBottom: 6,
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:   '#1c1c1e',
        width: '100%', maxWidth: 430,
        borderRadius: '24px 24px 0 0',
        padding:      '20px 20px 40px',
        animation:    'up .3s ease',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 100, background: '#3a3a3c', margin: '0 auto 20px' }} />

        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>New Workout</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Upper Body Power"
              style={field}
            />
          </div>

          <div>
            <label style={label}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this workout about?"
              rows={2}
              style={{ ...field, resize: 'none' }}
            />
          </div>

          <div>
            <label style={label}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    background: priority === p ? `${PC[p]}28` : '#2c2c2e',
                    color:      priority === p ? PC[p] : '#636366',
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.06em',
                    outline: priority === p ? `1.5px solid ${PC[p]}80` : 'none',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={label}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUSES.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    background: status === s ? `${SC[s]}28` : '#2c2c2e',
                    color:      status === s ? SC[s] : '#636366',
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.06em',
                    outline: status === s ? `1.5px solid ${SC[s]}80` : 'none',
                  }}
                >
                  {SL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={label}>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...field, colorScheme: 'dark' }}
            />
          </div>

          {/* Image upload */}
          <div>
            <label style={label}>Image (optional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,.6)', color: '#fff',
                    fontSize: 18, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '20px 0', borderRadius: 14,
                  background: '#2c2c2e', color: '#8e8e93',
                  fontSize: 13, fontWeight: 600,
                  border: '1.5px dashed #3a3a3c',
                }}
              >
                📷  Tap to add a photo
              </button>
            )}
          </div>

          {error && <p style={{ color: '#FF375F', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: '#2c2c2e', color: '#8e8e93',
                fontSize: 15, fontWeight: 700, border: 'none',
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 14,
                background: '#A5F044', color: '#000',
                fontSize: 15, fontWeight: 700, border: 'none',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating…' : 'Create Workout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
