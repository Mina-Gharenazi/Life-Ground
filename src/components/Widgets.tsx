import { useState } from 'react'
import type { Area, VitalityState } from '../model'
import { timeAgo } from '../model'

/** Ring chart of how the map splits by vitality state (weighted by importance). */
export function BalanceDonut({ shares }: { shares: Record<VitalityState, number> }) {
  const order: VitalityState[] = ['lush', 'mixed', 'struggling', 'barren']
  const r = 70
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 180 180" className="donut" aria-hidden>
      <circle cx="90" cy="90" r={r} className="donut__track" />
      {order.map((k) => {
        const len = shares[k] * c
        const gap = len > 8 ? 4 : 0
        const el = (
          <circle
            key={k}
            cx="90"
            cy="90"
            r={r}
            className={`donut__seg donut__seg--${k}`}
            strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
            strokeDashoffset={-offset}
          />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

/** One dot per day, lit when you checked in on anything that day. */
export function ActivityDots({ days }: { days: boolean[] }) {
  return (
    <div className="dots" aria-hidden>
      {days.map((on, i) => (
        <i key={i} className={on ? 'on' : ''} />
      ))}
    </div>
  )
}

/** Semicircle gauge, like a speedometer, for one area's vitality. */
export function VitalityGauge({ value }: { value: number | null }) {
  const r = 80
  const half = Math.PI * r
  const v = value ?? 0
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 112" aria-hidden>
        <defs>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0" stopColor="#ff6224" />
            <stop offset="0.55" stopColor="#b09cff" />
            <stop offset="1" stopColor="#6a48f6" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" className="gauge__track" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          className="gauge__fill"
          strokeDasharray={`${v * half} ${half}`}
        />
      </svg>
      <div className="gauge__value">
        {value === null ? '—' : Math.round(v * 100)}
        {value !== null && <small>%</small>}
      </div>
    </div>
  )
}

/** The gradient "insight" card: nudges you toward the areas you've gone quiet on. */
export function LookCard({ areas, onOpen }: { areas: Area[]; onOpen: (id: string) => void }) {
  const [i, setI] = useState(0)
  if (areas.length === 0) {
    return (
      <section className="insight">
        <span className="pill pill--glass">✦ Worth a look</span>
        <p className="bubble">You've said something about every area this week. Nice tending.</p>
      </section>
    )
  }
  const a = areas[i % areas.length]
  const last = a.checkIns[0]
  return (
    <section className="insight">
      <div className="insight__top">
        <span className="pill pill--glass">✦ Worth a look</span>
        <span className="pager" aria-hidden>
          {areas.map((x, j) => (
            <i key={x.id} className={j === i % areas.length ? 'on' : ''} />
          ))}
        </span>
      </div>
      <p className="bubble">
        {last ? (
          <>
            You last said something about <b>{a.name}</b> {timeAgo(last.at)}.
          </>
        ) : (
          <>
            You haven't checked in on <b>{a.name}</b> yet.
          </>
        )}{' '}
        It matters <b>{a.importance}/10</b> to you. How is it going?
      </p>
      <div className="insight__actions">
        {areas.length > 1 && (
          <button className="btn btn--dark btn--block" onClick={() => setI(i + 1)}>
            Next
          </button>
        )}
        <button className="btn btn--light btn--block" onClick={() => onOpen(a.id)}>
          Tend it now
        </button>
      </div>
    </section>
  )
}
