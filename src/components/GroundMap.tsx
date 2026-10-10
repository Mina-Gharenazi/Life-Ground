import { useEffect, useMemo, useRef, useState } from 'react'
import { streak, timeAgo, vitality, vitalityState, type Area } from '../model'
import { squarify } from '../treemap'
import { plotColors } from '../colors'

type Props = {
  areas: Area[]
  onOpen?: (id: string) => void
  highlightId?: string
  pulseId?: string | null
  compact?: boolean
}

/** The map: one square, every area a plot sized by importance and colored by vitality. */
export function GroundMap({ areas, onOpen, highlightId, pulseId, compact }: Props) {
  const now = Date.now()
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 600 })

  // Plot labels adapt to the plot's real pixel size, so measure the map.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width || 1, h: e.contentRect.height || 1 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Lay out in real pixels so plots stay close to square at any aspect ratio,
  // then convert to % so they animate smoothly when sizes change.
  const tiles = useMemo(
    () =>
      squarify(
        areas.map((a) => ({ value: a.importance, data: a })),
        { x: 0, y: 0, w: size.w, h: size.h },
      ).map(({ rect, data }) => ({
        data,
        px: rect,
        rect: { x: (rect.x / size.w) * 100, y: (rect.y / size.h) * 100, w: (rect.w / size.w) * 100, h: (rect.h / size.h) * 100 },
      })),
    [areas, size],
  )

  return (
    <div ref={ref} className={`map ${compact ? 'map--compact' : ''}`} role="list">
      {tiles.map(({ rect, px, data: area }) => {
        const v = vitality(area, now)
        const state = vitalityState(v)
        const colors = plotColors(v)
        const last = area.checkIns[0]
        const s = streak(area)
        const wPx = px.w
        const hPx = px.h
        const roomy = wPx > 120 && hPx > 110
        const tiny = wPx < 100 || hPx < 60
        const showImp = wPx >= 130 && hPx >= 60
        const classes = [
          'plot',
          `plot--${state}`,
          highlightId && highlightId !== area.id ? 'plot--dim' : '',
          highlightId === area.id ? 'plot--focus' : '',
          pulseId === area.id ? 'plot--pulse' : '',
        ].join(' ')
        return (
          <button
            key={area.id}
            role="listitem"
            className={classes}
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.w}%`,
              height: `${rect.h}%`,
              ['--bg-c' as string]: colors.bg,
              ['--fg' as string]: colors.fg,
            }}
            onClick={onOpen ? () => onOpen(area.id) : undefined}
            tabIndex={onOpen ? 0 : -1}
            aria-label={`${area.name}, importance ${area.importance} of 10, ${state}`}
          >
            <span className="plot__inner">
              {!compact && (
                <>
                  <span className={`plot__head ${tiny ? 'plot__head--tiny' : ''}`}>
                    {wPx >= 56 && <span className="plot__name">{area.name}</span>}
                    {showImp && <span className="plot__imp">{area.importance}/10</span>}
                  </span>
                  {roomy && (
                    <span className="plot__body">
                      {last && <span className="plot__tags">{last.tags.join(', ') || '—'}</span>}
                      <span className="plot__meta">
                        {!last
                          ? 'never checked in'
                          : s >= 2
                            ? `${s}× streak`
                            : `last said ${timeAgo(last.at, now)}`}
                      </span>
                    </span>
                  )}
                </>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
