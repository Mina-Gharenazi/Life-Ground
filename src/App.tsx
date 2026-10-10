import { useEffect, useRef, useState } from 'react'
import { aliveShare, sampleGround, timeAgo, worthALook } from './model'
import { exportBackup, readBackup, useGround } from './store'
import { GroundMap } from './components/GroundMap'
import { AreaDetail } from './components/AreaDetail'
import { AddArea } from './components/AddArea'

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
      <div className="empty">
        <div className="empty__seed" aria-hidden />
        <h1>No ground claimed yet</h1>
        <p className="muted">
          Add your first life area — the more you add, the more the map fills in, each one taking its
          fair share of the space.
        </p>
        <button className="btn" onClick={() => setAdding(true)}>
          + Claim first plot
        </button>
        <button className="link" onClick={() => store.replace(sampleGround())}>
          or look around a sample map
        </button>
      </div>
    )
  } else {
    const alive = Math.round(aliveShare(ground.areas) * 100)
    const look = worthALook(ground.areas)
    body = (
      <>
        <header className="top">
          <div>
            <p className="eyebrow">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1>Your ground</h1>
            <p className="muted lede">
              <strong className="alive">{alive}%</strong> of it is alive right now. Plot size is what you
              say matters — color is what's actually happening.
            </p>
          </div>
          <button className="fab" aria-label="Add an area" onClick={() => setAdding(true)}>
            +
          </button>
        </header>

        <GroundMap areas={ground.areas} onOpen={go} pulseId={pulseId} />

        <div className="legend" aria-hidden>
          <span><i className="lg lg--lush" />lush</span>
          <span><i className="lg lg--mixed" />mixed</span>
          <span><i className="lg lg--struggling" />struggling</span>
          <span><i className="lg lg--barren" />barren</span>
        </div>

        {look.length > 0 && (
          <section className="card look">
            <h2 className="eyebrow">Worth a look</h2>
            <ul>
              {look.map((a) => (
                <li key={a.id}>
                  <button onClick={() => go(a.id)}>
                    <span>{a.name}</span>
                    <span className="leader" />
                    <span className="muted small">
                      {a.checkIns[0] ? `last said ${timeAgo(a.checkIns[0].at)}` : 'never checked in'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="foot">
          <button className="link" onClick={() => exportBackup(ground)}>
            Export backup
          </button>
          <span className="muted">·</span>
          <button className="link" onClick={() => fileInput.current?.click()}>
            Import
          </button>
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
          <p className="muted small">Saved in this browser only. Export a backup to move devices.</p>
        </footer>
      </>
    )
  }

  return (
    <main className="app">
      {body}
      {adding && (
        <AddArea
          onClose={() => setAdding(false)}
          onAdd={(name, importance) => {
            const id = store.addArea(name, importance)
            setAdding(false)
            setPulseId(id)
          }}
        />
      )}
      {store.saveError && <div className="toast">Couldn't save — browser storage is full or blocked.</div>}
      {notice && <div className="toast">{notice}</div>}
    </main>
  )
}
