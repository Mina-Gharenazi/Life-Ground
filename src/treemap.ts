// Squarified treemap: splits a rectangle into tiles whose areas are
// proportional to the given values, keeping tiles as close to square as possible.

export type Rect = { x: number; y: number; w: number; h: number }

type Item<T> = { value: number; data: T }

function worst(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0)
  const max = Math.max(...row)
  const min = Math.min(...row)
  const s2 = side * side
  const sum2 = sum * sum
  return Math.max((s2 * max) / sum2, sum2 / (s2 * min))
}

export function squarify<T>(items: Item<T>[], bounds: Rect): { rect: Rect; data: T }[] {
  const total = items.reduce((a, i) => a + i.value, 0)
  if (items.length === 0 || total <= 0) return []
  const scale = (bounds.w * bounds.h) / total
  const queue = [...items].sort((a, b) => b.value - a.value).map((i) => ({ ...i, area: i.value * scale }))

  const out: { rect: Rect; data: T }[] = []
  let free = { ...bounds }
  let row: typeof queue = []

  const layoutRow = () => {
    const rowArea = row.reduce((a, i) => a + i.area, 0)
    const horizontal = free.w >= free.h // stack the row along the shorter side
    if (horizontal) {
      const colW = rowArea / free.h
      let y = free.y
      for (const i of row) {
        const h = i.area / colW
        out.push({ rect: { x: free.x, y, w: colW, h }, data: i.data })
        y += h
      }
      free = { x: free.x + colW, y: free.y, w: free.w - colW, h: free.h }
    } else {
      const rowH = rowArea / free.w
      let x = free.x
      for (const i of row) {
        const w = i.area / rowH
        out.push({ rect: { x, y: free.y, w, h: rowH }, data: i.data })
        x += w
      }
      free = { x: free.x, y: free.y + rowH, w: free.w, h: free.h - rowH }
    }
    row = []
  }

  for (const item of queue) {
    const side = Math.min(free.w, free.h)
    const areas = row.map((i) => i.area)
    if (row.length === 0 || worst([...areas, item.area], side) <= worst(areas, side)) {
      row.push(item)
    } else {
      layoutRow()
      row.push(item)
    }
  }
  if (row.length) layoutRow()
  return out
}
