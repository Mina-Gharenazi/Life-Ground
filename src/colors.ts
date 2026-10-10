// Vitality -> plot color. Continuous so the map reads like real land:
// terracotta (struggling) -> tan -> yellow-green -> deep green (lush).

type RGB = [number, number, number]

const STOPS: [number, RGB][] = [
  [0.0, [168, 92, 70]], // muted terracotta
  [0.3, [196, 140, 104]],
  [0.42, [205, 181, 128]], // tan
  [0.6, [168, 180, 96]], // yellow-green
  [0.75, [96, 142, 82]],
  [1.0, [54, 102, 60]], // deep green
]

const mix = (a: RGB, b: RGB, t: number): RGB => a.map((x, i) => Math.round(x + (b[i] - x) * t)) as RGB

export function plotColors(v: number | null): { bg: string; fg: string } {
  if (v === null) return { bg: 'var(--barren)', fg: 'var(--ink-soft)' }
  let rgb = STOPS[STOPS.length - 1][1]
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i]
    const [p0, c0] = STOPS[i - 1]
    if (v <= p1) {
      rgb = mix(c0, c1, (v - p0) / (p1 - p0))
      break
    }
  }
  const [r, g, b] = rgb
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return { bg: `rgb(${r} ${g} ${b})`, fg: luminance > 0.6 ? '#2b2a24' : '#fbf8f1' }
}
