// Vitality -> plot color. Continuous so the map reads at a glance:
// orange (struggling) -> lavender (mixed) -> deep violet (lush).

type RGB = [number, number, number]

const STOPS: [number, RGB][] = [
  [0.0, [255, 98, 36]], // struggling: hot orange
  [0.3, [255, 150, 92]],
  [0.42, [214, 204, 250]], // mixed: pale lavender
  [0.6, [176, 156, 255]],
  [0.75, [132, 104, 255]], // lush: violet
  [1.0, [106, 72, 246]],
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
  return { bg: `rgb(${r} ${g} ${b})`, fg: luminance > 0.62 ? '#17161c' : '#ffffff' }
}
