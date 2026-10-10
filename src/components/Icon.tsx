// Small line icons (24px grid, stroke = currentColor).
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-7 10-9',
  check: 'M4 12.5l5 5L20 6.5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 10l5-5 5 5M5 20h14',
  back: 'M15 5l-7 7 7 7',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  x: 'M6 6l12 12M18 6L6 18',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
} as const

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
