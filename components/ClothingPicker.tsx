'use client'

import { CATEGORIES } from '@/lib/clothing-icons'

interface Props {
  selected: string[]
  onChange: (items: string[]) => void
}

export default function ClothingPicker({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id],
    )
  }

  return (
    <div className="cp-wrap">
      {CATEGORIES.map(cat => (
        <div key={cat.name} className="cp-category">
          <div className="cp-cat-label">{cat.name}</div>
          <div className="cp-grid">
            {cat.items.map(item => {
              const Icon = item.Icon
              return (
                <button
                  key={item.id}
                  className={`cp-card${selected.includes(item.id) ? ' on' : ''}`}
                  onClick={() => toggle(item.id)}
                  aria-pressed={selected.includes(item.id)}
                  title={item.id}
                >
                  <span className="cp-icon"><Icon /></span>
                  <span className="cp-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
