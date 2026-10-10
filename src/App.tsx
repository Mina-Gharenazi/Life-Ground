import { useEffect, useRef, useState } from 'react'
import { activeDays, aliveShare, balance, checkInsSince, sampleGround, vitality, worthALook } from './model'
import { exportBackup, readBackup, useGround } from './store'
import { plotColors } from './colors'
import { GroundMap } from './components/GroundMap'
import { AreaDetail } from './components/AreaDetail'
import { AddArea } from './components/AddArea'
import { ActivityDots, BalanceDonut, LookCard } from './components/Widgets'
import { Icon } from './components/Icon'

// Tiny hash router: "#/area/<id>" opens an area, anything else is the map.
function useRoute() {
  const read = () => window.location.hash.match(/^#\/area\/(.+)$/)?.[1] ?? null
  const [areaId, setAreaId] = useState(read)
  useEffect(() => {
    const on = () => setAreaId(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (id: string | null) => {
    window.location.hash = id ? `/area/${id}` : '/'
    window.scrollTo({ top: 0 })
  }
  return [areaId, go] as const
}

const pct = (n: number) => Math.round(n * 100)

export default function App() {
  const store = useGround()
  const { ground } = store
  const [areaId, go] = useRoute()
  const [adding, setAdding] = useState(false)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pulseId) return
    const t = setTimeout(() => setPulseId(null), 1400)
    return () => clearTimeout(t)
  }, [pulseId])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice])

  const area = areaId ? ground.areas.find((a) => a.id === areaId) : undefined
  const sorted = [...ground.areas].sort((a, b) => b.importance - a.importance)

  const onImport = async (file: File) => {
    try {
      const next = await readBackup(file)
      if (ground.areas.length && !confirm('Replace your current map with this backup?')) return
      store.replace(next)
      setNotice(`Imported ${next.areas.length} areas`)
    } catch (e) {
      setNotice(`Couldn't import: ${(e as Error).message}`)
    }
  }

  let body
  if (area) {
    body = (
      <AreaDetail
        key={area.id}
        area={area}
        allAreas={ground.areas}
        customTags={ground.customTags}
        onBack={() => go(null)}
        onRename={(n) => store.renameArea(area.id, n)}
        onImportance={(n) => store.setImportance(area.id, n)}
        onAddTag={store.addCustomTag}
        onCheckIn={(tags) => {
          store.checkIn(area.id, tags)
          setPulseId(area.id)
          go(null)
        }}
        onRemoveCheckIn={(id) => store.removeCheckIn(area.id, id)}
        onRemove={() => {
          store.removeArea(area.id)
          go(null)
        }}
      />
    )
  } else if (ground.areas.length === 0) {
    body = (
      <div className="panel empty">
        <div className="empty__seed" aria-hidden>
          <i /><i /><i />
        </div>
        <h1>No ground claimed yet</h1>
        <p className="muted">
          Add your first life area — the more you add, the more the map fills in, each one taking its
          fair share of the space.
        </p>
        <button className="btn btn--light" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Claim first plot
        </button>
        <button className="link" onClick={() => store.replace(sampleGround())}>
          or look around a sample map
        </button>
      </div>
    )
  } else {
    const now = Date.now()
    const alive = aliveShare(ground.areas, now)
    const shares = balance(ground.areas, now)
    const week = checkInsSince(ground.areas, 7, now)
    const days = activeDays(ground.areas, 21, now)
    const activeCount = days.filter(Boolean).length
    const thriving = ground.areas.filter((a) => (vitality(a, now) ?? 0) >= 0.65).length
    body = (
      <div className="panel">
        <div className="greet">
          <h1>Hello there!</h1>
          <p className="muted">Here's your ground today.</p>
        </div>

        <div className="bento">
          <div className="card stat">
            <span className="stat__icon stat__icon--light"><Icon name="grid" /></span>
            <div className="stat__num">{ground.areas.length}<small> areas</small></div>
            <div className="muted">On your map</div>
          </div>
          <div className="card stat">
            <span className="stat__icon stat__icon--violet"><Icon name="leaf" /></span>
            <div className="stat__num">{pct(alive)}<small>%</small></div>
            <div className="muted">Alive right now</div>
          </div>
          <div className="card stat">
            <span className="stat__icon"><Icon name="check" /></span>
            <div className="stat__num">{week}</div>
            <div className="muted">Check-ins this week</div>
          </div>
          <div className="card stat">
            <div className="stat__num">{activeCount}<small> days</small></div>
            <div className="muted">Tended, last 3 weeks</div>
            <ActivityDots days={days} />
          </div>

          <section className="card map-card">
            <div className="card__head">
              <div>
                <h2>Your ground</h2>
                <p className="muted">Size is what matters to you — color is what's happening.</p>
              </div>
              <div className="legend" aria-hidden>
                <span><i className="lg lg--lush" />lush</span>
                <span><i className="lg lg--mixed" />mixed</span>
                <span><i className="lg lg--struggling" />struggling</span>
                <span><i className="lg lg--barren" />barren</span>
              </div>
            </div>
            <GroundMap areas={ground.areas} onOpen={go} pulseId={pulseId} />
          </section>

          <aside className="side-col">
            <section className="card balance">
              <div className="donut-wrap">
                <BalanceDonut shares={shares} />
                <div className="donut__label">
                  <b>{thriving}/{ground.areas.length}</b>
                  <span>thriving</span>
                </div>
              </div>
              <h3>Ground balance</h3>
              <ul className="balance__list">
                {(['lush', 'mixed', 'struggling', 'barren'] as const).map((k) => (
                  <li key={k}>
                    <i className={`lg lg--${k}`} />
                    <span>{k[0].toUpperCase() + k.slice(1)}</span>
                    <b>{pct(shares[k])}%</b>
                  </li>
                ))}
              </ul>
            </section>
            <LookCard areas={worthALook(ground.areas, now, 5)} onOpen={go} />
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <button className="brand" onClick={() => go(null)}>
          <span className="brand__mark" aria-hidden><i /><i /><i /><i /></span>
          Life Ground
        </button>

        <p className="nav__label">Main</p>
        <button className={`nav__item ${!area ? 'is-active' : ''}`} onClick={() => go(null)}>
          <Icon name="grid" /> Overview
        </button>
        <button className="nav__item" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Claim land
        </button>

        {sorted.length > 0 && (
          <>
            <p className="nav__label">Areas</p>
            <div className="nav__areas">
              {sorted.map((a) => (
                <button
                  key={a.id}
                  className={`nav__item nav__item--area ${a.id === areaId ? 'is-active' : ''}`}
                  onClick={() => go(a.id)}
                >
                  <i className="nav__dot" style={{ background: plotColors(vitality(a)).bg }} />
                  <span>{a.name}</span>
                  <small>{a.importance}</small>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="nav__foot">
          <p className="nav__label">Your data</p>
          <button className="nav__item" onClick={() => exportBackup(ground)} disabled={!ground.areas.length}>
            <Icon name="download" /> Export backup
          </button>
          <button className="nav__item" onClick={() => fileInput.current?.click()}>
            <Icon name="upload" /> Import
          </button>
          <p className="nav__note">Saved in this browser only.</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
      </nav>

      <div className="main">
        <header className="topbar">
          <span className="date-pill">
            <Icon name="calendar" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <button className="btn btn--light" onClick={() => setAdding(true)}>
            <Icon name="plus" /> New area
          </button>
        </header>
        {body}
      </div>

      {adding && (
        <AddArea
          onClose={() => setAdding(false)}
          onAdd={(name, importance) => {
            const id = store.addArea(name, importance)
            setAdding(false)
            setPulseId(id)
            go(null)
          }}
        />
      )}
      {store.saveError && <div className="toast">Couldn't save — browser storage is full or blocked.</div>}
      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}
