import { useState } from 'react'
import { STARTER_TAGS, TAG_GROUPS, timeAgo, vitality, type Area } from '../model'
import { plotColors } from '../colors'
import { GroundMap } from './GroundMap'

type Props = {
  area: Area
  allAreas: Area[]
  customTags: string[]
  onBack: () => void
  onRename: (name: string) => void
  onImportance: (n: number) => void
  onCheckIn: (tags: string[]) => void
  onAddTag: (tag: string) => void
  onRemoveCheckIn: (id: string) => void
  onRemove: () => void
}

export function AreaDetail(p: Props) {
  const { area } = p
  const v = vitality(area)
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(area.name)
  const [newTag, setNewTag] = useState('')

  const extraTags = p.customTags.filter((t) => !STARTER_TAGS.includes(t.toLowerCase()))
  const toggle = (t: string) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))

  const commitName = () => {
    const name = draftName.trim()
    if (name && name !== area.name) p.onRename(name)
    else setDraftName(area.name)
    setEditing(false)
  }

  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t) return
    p.onAddTag(t)
    setSelected((s) => (s.includes(t) ? s : [...s, t]))
    setNewTag('')
  }

  const chip = (t: string) => (
    <button
      key={t}
      type="button"
      className={`chip ${selected.includes(t) ? 'chip--on' : ''}`}
      aria-pressed={selected.includes(t)}
      onClick={() => toggle(t)}
    >
      {t}
    </button>
  )

  return (
    <div className="detail">
      <button className="link back" onClick={p.onBack}>
        ← back to the map
      </button>

      <header className="detail__head">
        <span className="swatch" style={{ background: plotColors(v).bg }} />
        <div className="detail__title">
          {editing ? (
            <input
              className="name-input"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') {
                  setDraftName(area.name)
                  setEditing(false)
                }
              }}
            />
          ) : (
            <h1 title="Click to rename" onClick={() => setEditing(true)}>
              {area.name}
            </h1>
          )}
          <p className="muted">{v === null ? 'untouched ground' : `${Math.round(v * 100)}% vitality`}</p>
        </div>
      </header>

      <section className="importance">
        <div className="importance__row">
          <label htmlFor="imp" className="eyebrow">
            Importance · {area.importance}/10
          </label>
          <span className="muted small">sets the size of this plot</span>
        </div>
        <input
          id="imp"
          type="range"
          min={1}
          max={10}
          value={area.importance}
          onChange={(e) => p.onImportance(Number(e.target.value))}
        />
        <div className="mini-map">
          <GroundMap areas={p.allAreas} highlightId={area.id} compact />
        </div>
      </section>

      <section className="card checkin">
        <h2 className="eyebrow">What's true here right now?</h2>
        {TAG_GROUPS.map((g) => (
          <div key={g.label} className="chip-row">
            {g.tags.map(chip)}
          </div>
        ))}
        {extraTags.length > 0 && <div className="chip-row">{extraTags.map(chip)}</div>}
        <form
          className="add-tag"
          onSubmit={(e) => {
            e.preventDefault()
            addTag()
          }}
        >
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="add your own word…"
            maxLength={32}
          />
          <button type="submit" className="btn btn--ghost" disabled={!newTag.trim()} aria-label="Add tag">
            +
          </button>
        </form>
        <div className="checkin__actions">
          <button className="link" onClick={p.onBack}>
            Not now
          </button>
          <button className="btn" disabled={selected.length === 0} onClick={() => p.onCheckIn(selected)}>
            Tend this land
          </button>
        </div>
      </section>

      {area.checkIns.length > 0 && (
        <section className="history">
          <h2 className="eyebrow">History</h2>
          <ul>
            {area.checkIns.map((c) => (
              <li key={c.id}>
                <span className="dot" />
                <span className="history__tags">{c.tags.join(', ')}</span>
                <span className="leader" />
                <span className="muted small">{timeAgo(c.at)}</span>
                <button
                  className="icon-btn"
                  aria-label="Delete this check-in"
                  onClick={() => p.onRemoveCheckIn(c.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        className="link danger remove"
        onClick={() => {
          if (confirm(`Remove “${area.name}” and its history from the map?`)) p.onRemove()
        }}
      >
        Remove this area
      </button>
    </div>
  )
}
