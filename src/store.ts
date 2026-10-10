import { useCallback, useEffect, useState } from 'react'
import { emptyGround, parseGround, uid, type Area, type Ground } from './model'

const KEY = 'your-ground/v1'

function load(): Ground {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseGround(JSON.parse(raw)) : emptyGround()
  } catch {
    return emptyGround()
  }
}

/** All app state, persisted to localStorage on every change. */
export function useGround() {
  const [ground, setGround] = useState<Ground>(load)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ground))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [ground])

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setGround(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const updateArea = useCallback((id: string, fn: (a: Area) => Area) => {
    setGround((g) => ({ ...g, areas: g.areas.map((a) => (a.id === id ? fn(a) : a)) }))
  }, [])

  const actions = {
    addArea(name: string, importance: number) {
      const area: Area = { id: uid(), name, importance, createdAt: Date.now(), checkIns: [] }
      setGround((g) => ({ ...g, areas: [...g.areas, area] }))
      return area.id
    },
    removeArea(id: string) {
      setGround((g) => ({ ...g, areas: g.areas.filter((a) => a.id !== id) }))
    },
    renameArea(id: string, name: string) {
      updateArea(id, (a) => ({ ...a, name }))
    },
    setImportance(id: string, importance: number) {
      updateArea(id, (a) => ({ ...a, importance }))
    },
    checkIn(id: string, tags: string[]) {
      updateArea(id, (a) => ({ ...a, checkIns: [{ id: uid(), at: Date.now(), tags }, ...a.checkIns] }))
    },
    removeCheckIn(areaId: string, checkInId: string) {
      updateArea(areaId, (a) => ({ ...a, checkIns: a.checkIns.filter((c) => c.id !== checkInId) }))
    },
    addCustomTag(tag: string) {
      setGround((g) =>
        g.customTags.some((t) => t.toLowerCase() === tag.toLowerCase())
          ? g
          : { ...g, customTags: [...g.customTags, tag] },
      )
    },
    replace(next: Ground) {
      setGround(next)
    },
  }

  return { ground, saveError, ...actions }
}

export function exportBackup(ground: Ground) {
  const blob = new Blob([JSON.stringify(ground, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `your-ground-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function readBackup(file: File): Promise<Ground> {
  return parseGround(JSON.parse(await file.text()))
}
