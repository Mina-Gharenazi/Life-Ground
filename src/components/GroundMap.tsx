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
  const [size, setSize] = useState(600)

  // Plot labels adapt to the plot's real pixel size, so measure the map.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const tiles = useMemo(
    () =>
      squarify(
        areas.map((a) => ({ value: a.importance, data: a })),
        { x: 0, y: 0, w: 100, h: 100 },
      ),
    [areas],
  )

  return (
    <div ref={ref} className={`map ${compact ? 'map--compact' : ''}`} role="list">
      {tiles.map(({ rect, data: area }) => {
        const v = vitality(area, now)
        const state = vitalityState(v)
        const colors = plotColors(v)
        const last = area.checkIns[0]
        const s = streak(area)
        const wPx = (rect.w / 100) * size
        const hPx = (rect.h / 100) * size
        const roomy = wPx > 120 && hPx > 95
        const tiny = wPx < 90 || hPx < 50
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
              ['--bg' as string]: colors.bg,
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
                    <span className="plot__name">{area.name}</span>
                    {!tiny && <span className="plot__imp">{area.importance}/10</span>}
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
