'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Outfit, SavedOutfit } from '@/lib/types'
import OutfitCard from './OutfitCard'
import SkeletonCard from './SkeletonCard'
import SavedOutfits from './SavedOutfits'

// ─── Constants ────────────────────────────────────────────────────────────────
const OCCASIONS = [
  { value: 'Work',       emoji: '💼', label: 'Work'       },
  { value: 'University', emoji: '🎓', label: 'University' },
  { value: 'Dinner',     emoji: '🍽️', label: 'Dinner'     },
  { value: 'Wedding',    emoji: '💍', label: 'Wedding'    },
  { value: 'Casual',     emoji: '👟', label: 'Casual'     },
  { value: 'Travel',     emoji: '✈️', label: 'Travel'     },
  { value: 'Gym',        emoji: '🏋️', label: 'Gym'        },
  { value: 'Party',      emoji: '🎉', label: 'Party'      },
]

const STYLES = [
  { value: 'Classy',      emoji: '👗', label: 'Classy'      },
  { value: 'Modest',      emoji: '🧕', label: 'Modest'      },
  { value: 'Trendy',      emoji: '✨', label: 'Trendy'      },
  { value: 'Minimal',     emoji: '🤍', label: 'Minimal'     },
  { value: 'Sporty',      emoji: '🏃', label: 'Sporty'      },
  { value: 'Luxury',      emoji: '💎', label: 'Luxury'      },
  { value: 'Streetwear',  emoji: '🧢', label: 'Streetwear'  },
]

const MODEL = 'llama-3.3-70b-versatile'

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(params: {
  occasion: string; style: string; wardrobe: string
  colors: string[]; weather: string; notes: string
}) {
  const { occasion, style, wardrobe, colors, weather, notes } = params
  return `Create exactly 3 distinct, creative outfit suggestions based on the user's preferences below.

Occasion: ${occasion || 'Not specified'}
Style: ${style || 'Not specified'}
Available wardrobe items: ${wardrobe || 'Any items you like'}
Preferred colors: ${colors.length ? colors.join(', ') : 'No specific preference'}
Weather / Temperature: ${weather || 'Not specified'}
Additional notes: ${notes || 'None'}

Respond with ONLY a JSON object in this exact shape (no markdown, no preamble):
{
  "outfits": [
    {
      "name": "Creative outfit name",
      "pieces": ["piece 1", "piece 2", "piece 3", "piece 4"],
      "colorPalette": ["color 1", "color 2", "color 3"],
      "shoes": "Specific shoe recommendation with brief styling tip",
      "accessories": "Bag and accessories with brief styling tip",
      "whyItWorks": "2–3 sentences explaining why this outfit is perfect for the occasion and style",
      "confidenceScore": 94
    }
  ]
}

Rules:
- Each outfit must be distinct in vibe and pieces.
- confidenceScore is 70–98 based on how well it fits the brief.
- If wardrobe items are listed, try to use them; otherwise suggest realistic items.
- Be specific (e.g. "ivory silk slip dress" not just "dress").`
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OutfitApp() {
  // Form
  const [occasion, setOccasion]     = useState('')
  const [style, setStyle]           = useState('')
  const [wardrobe, setWardrobe]     = useState('')
  const [colors, setColors]         = useState<string[]>([])
  const [colorInput, setColorInput] = useState('')
  const [weather, setWeather]       = useState('')
  const [notes, setNotes]           = useState('')

  // App
  const [loading, setLoading]         = useState(false)
  const [outfits, setOutfits]         = useState<Outfit[]>([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError]             = useState('')
  const [savedOutfits, setSaved]      = useState<SavedOutfit[]>([])
  const [theme, setTheme]             = useState<'light' | 'dark'>('light')
  const [toastMsg, setToastMsg]       = useState('')
  const [showToast, setShowToast]     = useState(false)

  const resultsRef    = useRef<HTMLElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = (localStorage.getItem('outfitai_theme') ?? 'light') as 'light' | 'dark'
    setTheme(t)

    try {
      setSaved(JSON.parse(localStorage.getItem('outfitai_saved') ?? '[]'))
    } catch { /* empty */ }

    const p = new URLSearchParams(window.location.search)
    const o = p.get('occasion')
    const s = p.get('style')
    if (o && OCCASIONS.some(x => x.value === o)) setOccasion(o)
    if (s && STYLES.some(x => x.value === s))    setStyle(s)
  }, [])

  // ─── Theme ────────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('outfitai_theme', next)
      return next
    })
  }, [])

  // ─── Toast ────────────────────────────────────────────────────────────────
  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    setShowToast(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2800)
  }, [])

  // ─── URL sync ─────────────────────────────────────────────────────────────
  const syncURL = useCallback((occ: string, sty: string) => {
    const p = new URLSearchParams(window.location.search)
    if (occ) p.set('occasion', occ); else p.delete('occasion')
    if (sty) p.set('style', sty);    else p.delete('style')
    window.history.replaceState({}, '', `${location.pathname}?${p}`)
  }, [])

  const handleOccasion = useCallback((v: string) => {
    setOccasion(v); syncURL(v, style)
  }, [style, syncURL])

  const handleStyle = useCallback((v: string) => {
    setStyle(v); syncURL(occasion, v)
  }, [occasion, syncURL])

  // ─── Colors ───────────────────────────────────────────────────────────────
  const addColor = useCallback(() => {
    const v = colorInput.trim()
    if (!v || colors.includes(v)) { setColorInput(''); return }
    setColors(prev => [...prev, v])
    setColorInput('')
  }, [colorInput, colors])

  const removeColor = useCallback((i: number) => {
    setColors(prev => prev.filter((_, idx) => idx !== i))
  }, [])

  // ─── Generate ─────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    setShowResults(true)
    setLoading(true)
    setError('')
    setOutfits([])

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)

    const prompt = buildPrompt({ occasion, style, wardrobe, colors, weather, notes })

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: MODEL }),
      })

      const data = await res.json() as {
        choices?: Array<{ message?: { content?: string } }>
        error?: string
      }

      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)

      const raw = data?.choices?.[0]?.message?.content ?? ''
      if (!raw) throw new Error('Empty response from AI. Try again.')

      let parsed: { outfits?: Outfit[] }
      try {
        parsed = JSON.parse(raw.replace(/^```json\s*/,'').replace(/```\s*$/,'').trim())
      } catch {
        throw new Error('Could not parse AI response. Try regenerating.')
      }

      const result = parsed?.outfits ?? []
      if (!result.length) throw new Error('No outfits returned. Adjust your preferences and try again.')
      setOutfits(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [occasion, style, wardrobe, colors, weather, notes])

  // ─── Save / unsave ────────────────────────────────────────────────────────
  const toggleSave = useCallback((outfit: Outfit) => {
    setSaved(prev => {
      const idx = prev.findIndex(o => o.name === outfit.name)
      let next: SavedOutfit[]
      if (idx >= 0) {
        next = prev.filter((_, i) => i !== idx)
        toast('Outfit removed.')
      } else {
        next = [{ ...outfit, savedAt: new Date().toISOString(), occasion, style }, ...prev]
        toast('Outfit saved ✨')
      }
      localStorage.setItem('outfitai_saved', JSON.stringify(next))
      return next
    })
  }, [occasion, style, toast])

  const deleteSaved = useCallback((name: string) => {
    setSaved(prev => {
      const next = prev.filter(o => o.name !== name)
      localStorage.setItem('outfitai_saved', JSON.stringify(next))
      return next
    })
    toast('Outfit removed.')
  }, [toast])

  // ─── Copy ─────────────────────────────────────────────────────────────────
  const copyOutfit = useCallback(async (outfit: Outfit) => {
    const text = [
      `✨ ${outfit.name}`,
      '',
      `🎨 Colors: ${outfit.colorPalette?.join(', ')}`,
      '',
      '👗 Pieces:',
      ...(outfit.pieces?.map(p => `  · ${p}`) ?? []),
      '',
      `👠 Shoes: ${outfit.shoes}`,
      `👜 Accessories: ${outfit.accessories}`,
      '',
      `💬 Why it works: ${outfit.whyItWorks}`,
      `Match: ${outfit.confidenceScore}%`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      toast('Outfit copied to clipboard!')
    } catch {
      toast('Copy failed — try again.')
    }
  }, [toast])

  // ─── Share ────────────────────────────────────────────────────────────────
  const shareOutfit = useCallback(() => {
    const url = new URL(window.location.href)
    if (occasion) url.searchParams.set('occasion', occasion)
    if (style)    url.searchParams.set('style', style)
    navigator.clipboard
      .writeText(url.toString())
      .then(() => toast('Share link copied 🔗'))
      .catch(() => toast('Could not copy link.'))
  }, [occasion, style, toast])

  const isSaved = useCallback((name: string) => savedOutfits.some(o => o.name === name), [savedOutfits])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">Outfit<span>AI</span></div>
          <div className="header-btns">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle colour theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">✨ Powered by Groq — Free &amp; Fast</div>
        <h1 className="hero-title">
          Your <em>Personal</em>
          <br />
          AI Outfit Stylist
        </h1>
        <p className="hero-sub">
          Tell me your occasion, style, and what&apos;s in your wardrobe — I&apos;ll craft three perfect looks just for you.
        </p>
      </section>

      {/* Main */}
      <main className="main">

        {/* ── Form ── */}
        <section>
          <div className="form-grid">

            {/* Occasion */}
            <div className="form-card">
              <div className="field-label">📅 Occasion</div>
              <div className="opt-grid">
                {OCCASIONS.map(o => (
                  <button
                    key={o.value}
                    className={`opt-card${occasion === o.value ? ' on' : ''}`}
                    onClick={() => handleOccasion(o.value)}
                  >
                    <span className="opt-emoji">{o.emoji}</span>
                    <span className="opt-label">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="form-card">
              <div className="field-label">💫 Your Style</div>
              <div className="opt-grid">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    className={`opt-card${style === s.value ? ' on' : ''}`}
                    onClick={() => handleStyle(s.value)}
                  >
                    <span className="opt-emoji">{s.emoji}</span>
                    <span className="opt-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wardrobe */}
            <div className="form-card">
              <div className="field-label">👗 Your Wardrobe Items</div>
              <textarea
                className="f-textarea"
                value={wardrobe}
                onChange={e => setWardrobe(e.target.value)}
                placeholder="e.g. white button-up, black trousers, floral midi dress, light-wash jeans, beige blazer, white sneakers…"
              />
            </div>

            {/* Colors */}
            <div className="form-card">
              <div className="field-label">🎨 Preferred Colors</div>
              <div className="color-row">
                <input
                  className="f-input"
                  type="text"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
                  placeholder="e.g. blush pink, ivory…"
                  aria-label="Add a preferred color"
                />
                <button className="add-btn" onClick={addColor}>+ Add</button>
              </div>
              <div className="chips">
                {colors.map((c, i) => (
                  <div key={i} className="chip">
                    {c}
                    <button className="chip-x" onClick={() => removeColor(i)} aria-label={`Remove ${c}`}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="form-card">
              <div className="field-label">🌡️ Weather / Temperature</div>
              <input
                className="f-input"
                type="text"
                value={weather}
                onChange={e => setWeather(e.target.value)}
                placeholder="e.g. 22°C sunny, cold winter day, hot and humid…"
              />
            </div>

            {/* Notes */}
            <div className="form-card">
              <div className="field-label">📝 Notes &amp; Preferences</div>
              <textarea
                className="f-textarea"
                style={{ minHeight: '80px' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. comfortable and easy to walk in, avoid heels, need pockets…"
              />
            </div>

          </div>

          {/* Generate */}
          <div className="gen-wrap">
            <button className="gen-btn" onClick={generate} disabled={loading} aria-busy={loading}>
              {loading ? (
                <><div className="spinner" aria-hidden="true" /><span>Styling your look…</span></>
              ) : (
                <span>✨ Generate My Outfits</span>
              )}
            </button>
          </div>
        </section>

        {/* ── Results ── */}
        {showResults && (
          <section ref={resultsRef} className="results" aria-live="polite" aria-label="Outfit results">
            <div className="sec-hdr">
              <h2 className="sec-title">Your Outfit Looks</h2>
              <button className="regen-btn" onClick={generate} disabled={loading}>🔄 Regenerate</button>
            </div>
            <div className="outfits-grid">
              {loading ? (
                <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
              ) : error ? (
                <div className="err-box" role="alert">
                  <div className="err-icon">⚠️</div>
                  <div>
                    <div className="err-title">Something went wrong</div>
                    <div className="err-msg">{error}</div>
                  </div>
                </div>
              ) : (
                outfits.map((outfit, i) => (
                  <OutfitCard
                    key={`${outfit.name}-${i}`}
                    outfit={outfit}
                    index={i}
                    isSaved={isSaved(outfit.name)}
                    onSave={() => toggleSave(outfit)}
                    onCopy={() => copyOutfit(outfit)}
                    onShare={shareOutfit}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* ── Saved ── */}
        <SavedOutfits outfits={savedOutfits} onDelete={deleteSaved} />

      </main>

      {/* Footer */}
      <footer className="footer">
        Built with{' '}
        <a href="https://groq.com" target="_blank" rel="noopener noreferrer">Groq AI</a>
        {' '}· Your wardrobe, elevated ✨
      </footer>

      {/* Toast */}
      <div className={`toast${showToast ? ' show' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  )
}
