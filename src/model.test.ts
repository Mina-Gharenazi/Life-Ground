import { describe, expect, it } from 'vitest'
import { aliveShare, checkInScore, parseGround, sampleGround, vitality, vitalityState, worthALook, type Area } from './model'
import { squarify } from './treemap'

const DAY = 86400000
const now = Date.UTC(2026, 9, 10)
const area = (checks: [number, string[]][], importance = 5): Area => ({
  id: Math.random().toString(),
  name: 'x',
  importance,
  createdAt: 0,
  checkIns: checks.map(([d, tags], i) => ({ id: String(i), at: now - d * DAY, tags })),
})
const state = (a: Area) => vitalityState(vitality(a, now))

describe('vitality', () => {
  it('never checked in is barren', () => expect(state(area([]))).toBe('barren'))
  it('recent positive is lush', () => expect(state(area([[1, ['on track', 'enjoying it']]]))).toBe('lush'))
  it('positive + negative reads as mixed, not positive', () => {
    expect(state(area([[1, ['on track', 'resentful']]]))).toBe('mixed')
    expect(checkInScore(['on track', 'resentful'])).toBeLessThan(checkInScore(['on track']))
  })
  it('positive but gone quiet fades to mixed', () => expect(state(area([[90, ['on track']]]))).toBe('mixed'))
  it('strong negatives are struggling and stay so', () =>
    expect(state(area([[180, ['stalled', 'want to quit']]]))).toBe('struggling'))
  it('matches the mockup sample map', () => {
    const g = sampleGround(now)
    const by = Object.fromEntries(g.areas.map((a) => [a.name, state(a)]))
    expect(by).toMatchObject({
      Health: 'mixed', Partner: 'lush', Career: 'lush', Family: 'lush', 'Startup / AI-ML': 'lush',
      Friends: 'barren', German: 'mixed', 'Personal growth': 'mixed', Violin: 'struggling',
    })
  })
})

describe('worth a look', () => {
  it('lists never-checked-in first, then the longest silence, skipping recent ones', () => {
    const a = { ...area([[3, ['neutral']]]), name: 'recent' }
    const b = { ...area([[40, ['neutral']]]), name: 'old' }
    const c = { ...area([]), name: 'never' }
    expect(worthALook([a, b, c], now).map((x) => x.name)).toEqual(['never', 'old'])
  })
})

describe('aliveShare', () => {
  it('is 0 for an all-barren map', () => expect(aliveShare([area([]), area([])], now)).toBe(0))
})

describe('squarify', () => {
  it('areas are proportional and fill the square', () => {
    const tiles = squarify([5, 3, 2].map((v) => ({ value: v, data: v })), { x: 0, y: 0, w: 100, h: 100 })
    const areaOf = (v: number) => tiles.find((t) => t.data === v)!.rect
    expect(areaOf(5).w * areaOf(5).h).toBeCloseTo(5000)
    expect(areaOf(2).w * areaOf(2).h).toBeCloseTo(2000)
    for (const t of tiles) {
      expect(t.rect.x + t.rect.w).toBeLessThanOrEqual(100.0001)
      expect(t.rect.y + t.rect.h).toBeLessThanOrEqual(100.0001)
    }
  })
})

describe('parseGround', () => {
  it('round-trips a backup', () => {
    const g = sampleGround(now)
    expect(parseGround(JSON.parse(JSON.stringify(g)))).toEqual(g)
  })
  it('rejects junk', () => expect(() => parseGround({ foo: 1 })).toThrow())
})
