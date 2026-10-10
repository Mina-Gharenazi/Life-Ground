// Core data model and the "how is it going" formulas.
// Everything here is pure so it can be tested without a browser.

export type CheckIn = {
  id: string
  at: number // epoch ms
  tags: string[]
}

export type Area = {
  id: string
  name: string
  importance: number // 1-10, sets plot size
  createdAt: number
  checkIns: CheckIn[] // newest first
}

export type Ground = {
  version: 1
  areas: Area[]
  customTags: string[]
}

export type VitalityState = 'lush' | 'mixed' | 'barren' | 'struggling'

const DAY = 24 * 60 * 60 * 1000

// Starter tags, grouped as in the mockup. Weight = how strongly a tag pulls
// the area toward thriving (+) or struggling (-). Unknown/custom tags are 0.
export const TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: 'Progress', tags: ['on track', 'behind', 'stalled', 'ahead'] },
  { label: 'Feeling', tags: ['enjoying it', 'neutral', 'draining', 'resentful'] },
  { label: 'Direction', tags: ['growing', 'plateaued', 'want to quit'] },
  { label: 'Other', tags: ['needs attention', 'low priority right now', 'shipped something'] },
]

export const STARTER_TAGS = TAG_GROUPS.flatMap((g) => g.tags)

const TAG_WEIGHTS: Record<string, number> = {
  'on track': 0.8,
  ahead: 1,
  'enjoying it': 0.8,
  growing: 0.8,
  'shipped something': 1,
  neutral: 0,
  'low priority right now': 0,
  behind: -0.3,
  plateaued: -0.3,
  'needs attention': -0.3,
  draining: -0.6,
  resentful: -0.7,
  stalled: -1,
  'want to quit': -1,
}

export const tagWeight = (tag: string) => TAG_WEIGHTS[tag.toLowerCase()] ?? 0

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Score of one check-in, 0..1 (0.5 = neutral). Positive + negative together reads as mixed. */
export function checkInScore(tags: string[]): number {
  const weights = tags.map(tagWeight)
  const hasPos = weights.some((w) => w > 0)
  const hasNeg = weights.some((w) => w < 0)
  const sum = clamp(weights.reduce((a, b) => a + b, 0), -1, 1)
  // Mixed signals get squeezed toward the middle.
  const spread = hasPos && hasNeg ? 0.2 : 0.5
  return 0.5 + spread * sum
}

const RECENT = 5 // how many check-ins count toward vitality
const HALF_LIFE_DAYS = 14 // older check-ins count less than newer ones
const QUIET_DAYS = 30 // positive vitality fades toward "mixed" when nothing is said

/**
 * Vitality 0..1, or null when the area was never checked in.
 * Recency-weighted average of the last few check-ins. Good news fades if you go
 * quiet; bad news stays until you say otherwise.
 */
export function vitality(area: Area, now = Date.now()): number | null {
  const recent = area.checkIns.slice(0, RECENT)
  if (recent.length === 0) return null
  let total = 0
  let weightSum = 0
  for (const c of recent) {
    const ageDays = Math.max(0, (now - c.at) / DAY)
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS)
    total += w * checkInScore(c.tags)
    weightSum += w
  }
  // weightSum can underflow for very old data; fall back to a plain average.
  let v =
    weightSum > 1e-9
      ? total / weightSum
      : recent.reduce((a, c) => a + checkInScore(c.tags), 0) / recent.length
  if (v > 0.5) {
    const quietDays = Math.max(0, (now - recent[0].at) / DAY)
    v = 0.5 + (v - 0.5) * Math.exp(-quietDays / QUIET_DAYS)
  }
  return clamp(v, 0, 1)
}

export function vitalityState(v: number | null): VitalityState {
  if (v === null) return 'barren'
  if (v >= 0.65) return 'lush'
  if (v < 0.3) return 'struggling'
  return 'mixed'
}

/** Consecutive most-recent check-ins that read as thriving. */
export function streak(area: Area): number {
  let n = 0
  for (const c of area.checkIns) {
    if (checkInScore(c.tags) >= 0.65) n++
    else break
  }
  return n
}

/** Share of your ground that is alive: importance-weighted vitality, barren counts as 0. */
export function aliveShare(areas: Area[], now = Date.now()): number {
  const total = areas.reduce((a, x) => a + x.importance, 0)
  if (total === 0) return 0
  const alive = areas.reduce((a, x) => a + x.importance * (vitality(x, now) ?? 0), 0)
  return alive / total
}

/** Areas you've said nothing about for the longest. Never judges, never colors. */
export function worthALook(areas: Area[], now = Date.now(), limit = 3): Area[] {
  const lastAt = (a: Area) => a.checkIns[0]?.at ?? -Infinity
  return areas
    .filter((a) => a.checkIns.length === 0 || now - lastAt(a) > 7 * DAY)
    .sort((a, b) => lastAt(a) - lastAt(b) || b.importance - a.importance)
    .slice(0, limit)
}

export function timeAgo(at: number, now = Date.now()): string {
  const days = Math.floor((now - at) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const emptyGround = (): Ground => ({ version: 1, areas: [], customTags: [] })

/** Validate and normalise anything loaded from storage or an imported file. */
export function parseGround(raw: unknown): Ground {
  if (!raw || typeof raw !== 'object') throw new Error('Not a Your Ground backup')
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.areas)) throw new Error('Backup has no areas')
  const areas: Area[] = r.areas.map((a: Record<string, unknown>) => {
    if (typeof a?.name !== 'string') throw new Error('Area without a name')
    const checkIns = Array.isArray(a.checkIns) ? a.checkIns : []
    return {
      id: typeof a.id === 'string' ? a.id : uid(),
      name: a.name,
      importance: clamp(Math.round(Number(a.importance) || 5), 1, 10),
      createdAt: Number(a.createdAt) || Date.now(),
      checkIns: checkIns
        .filter((c: Record<string, unknown>) => c && Array.isArray(c.tags))
        .map((c: Record<string, unknown>) => ({
          id: typeof c.id === 'string' ? c.id : uid(),
          at: Number(c.at) || Date.now(),
          tags: (c.tags as unknown[]).filter((t): t is string => typeof t === 'string'),
        }))
        .sort((x: CheckIn, y: CheckIn) => y.at - x.at),
    }
  })
  const customTags = Array.isArray(r.customTags)
    ? r.customTags.filter((t): t is string => typeof t === 'string')
    : []
  return { version: 1, areas, customTags }
}

/** The example map from the mockup, for trying the app out. */
export function sampleGround(now = Date.now()): Ground {
  const d = (days: number) => now - days * DAY
  const area = (name: string, importance: number, checks: [number, string[]][]): Area => ({
    id: uid(),
    name,
    importance,
    createdAt: d(200),
    checkIns: checks.map(([days, tags]) => ({ id: uid(), at: d(days), tags })),
  })
  return {
    version: 1,
    customTags: [],
    areas: [
      area('Health', 9, [[20, ['behind']]]),
      area('Partner', 9, [[2, ['on track', 'enjoying it']], [9, ['on track']]]),
      area('Career', 8, [[3, ['on track']], [12, ['on track', 'growing']]]),
      area('Family', 8, [[10, ['on track']]]),
      area('Startup / AI-ML', 7, [
        [1, ['on track', 'enjoying it']],
        [5, ['shipped something']],
        [9, ['growing']],
        [15, ['on track']],
      ]),
      area('Friends', 6, []),
      area('Finance', 6, []),
      area('German', 5, [[1, ['behind', 'draining']], [3, ['behind']], [6, ['on track']]]),
      area('Personal growth', 5, [[14, ['neutral']]]),
      area('Home', 4, []),
      area('Violin', 3, [[180, ['stalled', 'want to quit']]]),
      area('Appearance', 3, []),
    ],
  }
}

// ---------- dashboard stats ----------

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Number of check-ins in the last `days` days. */
export function checkInsSince(areas: Area[], days: number, now = Date.now()): number {
  const from = now - days * DAY
  return areas.reduce((n, a) => n + a.checkIns.filter((c) => c.at >= from).length, 0)
}

/** For each of the last `days` days (oldest first): did you check in on anything? */
export function activeDays(areas: Area[], days: number, now = Date.now()): boolean[] {
  const today = startOfDay(now)
  const hit = new Set(areas.flatMap((a) => a.checkIns.map((c) => startOfDay(c.at))))
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(today)
    day.setDate(day.getDate() - (days - 1 - i))
    return hit.has(day.getTime())
  })
}

/** Share of the map (by importance) in each vitality state. */
export function balance(areas: Area[], now = Date.now()): Record<VitalityState, number> {
  const out: Record<VitalityState, number> = { lush: 0, mixed: 0, struggling: 0, barren: 0 }
  const total = areas.reduce((a, x) => a + x.importance, 0)
  if (total === 0) return out
  for (const a of areas) out[vitalityState(vitality(a, now))] += a.importance / total
  return out
}
