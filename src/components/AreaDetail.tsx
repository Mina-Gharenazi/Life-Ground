import { useState } from 'react'
import { STARTER_TAGS, TAG_GROUPS, streak, timeAgo, vitality, vitalityState, type Area } from '../model'
import { plotColors } from '../colors'
import { GroundMap } from './GroundMap'
import { VitalityGauge } from './Widgets'
import { Icon } from './Icon'

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

  const state = vitalityState(v)
  const s = streak(area)

  return (
    <div className="panel detail">
      <button className="link back" onClick={p.onBack}>
        <Icon name="back" /> back to the map
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
              {area.name} <span className="edit-hint"><Icon name="pencil" /></span>
            </h1>
          )}
          <p className="muted">
            <span className={`state-pill state-pill--${state}`}>{state}</span>
            {area.checkIns[0] ? ` last said ${timeAgo(area.checkIns[0].at)}` : ' never checked in'}
            {s >= 2 && ` · ${s}× streak`}
          </p>
        </div>
      </header>

      <div className="detail__grid">
        <div className="detail__side">
          <section className="card card--light gauge-card">
            <div className="card__head">
              <h2>Vitality</h2>
            </div>
            <VitalityGauge value={v} />
            <p className="gauge-card__note">
              {v === null ? 'Untouched ground — tend it once to bring it to life.' : 'From what you said lately.'}
            </p>
          </section>

          <section className="card importance">
            <div className="importance__row">
              <h2>Importance</h2>
              <span className="big-num">
                {area.importance}
                <small>/10</small>
              </span>
            </div>
            <input
              aria-label="Importance"
              type="range"
              min={1}
              max={10}
              value={area.importance}
              style={{ ['--fill' as string]: `${((area.importance - 1) / 9) * 100}%` }}
              onChange={(e) => p.onImportance(Number(e.target.value))}
            />
            <p className="muted small">Sets the size of this plot. The others make room.</p>
            <div className="mini-map">
              <GroundMap areas={p.allAreas} highlightId={area.id} compact />
            </div>
          </section>
        </div>

        <div className="detail__main">
          <section className="card checkin">
            <div className="card__head">
              <div>
                <h2>What's true here right now?</h2>
                <p className="muted">Pick as many as fit. Mixed signals are real signals.</p>
              </div>
            </div>
            <div className="chip-row">
              {TAG_GROUPS.flatMap((g) => g.tags).map(chip)}
              {extraTags.map(chip)}
            </div>
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
                placeholder="Add your own word…"
                maxLength={32}
              />
              <button type="submit" className="round-btn" disabled={!newTag.trim()} aria-label="Add tag">
                <Icon name="plus" />
              </button>
            </form>
            <div className="checkin__actions">
              <button className="btn btn--dark" onClick={p.onBack}>
                Not now
              </button>
              <button className="btn btn--violet" disabled={selected.length === 0} onClick={() => p.onCheckIn(selected)}>
                Tend this land
              </button>
            </div>
          </section>

          <section className="card history">
            <div className="card__head">
              <h2>History</h2>
              <span className="muted small">{area.checkIns.length} check-in{area.checkIns.length === 1 ? '' : 's'}</span>
            </div>
            {area.checkIns.length === 0 ? (
              <p className="muted">Nothing yet. Your first check-in will show up here.</p>
            ) : (
              <ul>
                {area.checkIns.map((c) => (
                  <li key={c.id}>
                    <span className="history__tags">
                      {c.tags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </span>
                    <span className="time-pill">{timeAgo(c.at)}</span>
                    <button
                      className="icon-btn"
                      aria-label="Delete this check-in"
                      onClick={() => p.onRemoveCheckIn(c.id)}
                    >
                      <Icon name="x" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            className="link danger remove"
            onClick={() => {
              if (confirm(`Remove “${area.name}” and its history from the map?`)) p.onRemove()
            }}
          >
            <Icon name="trash" /> Remove this area
          </button>
        </div>
      </div>
    </div>
  )
}
