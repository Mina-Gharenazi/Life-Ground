# Life Ground

Your life as one map. Each life area is a plot of land:

- **Size** = how much it matters to you (you set it, 1–10). The map is a fixed square, so adding an area takes ground from all the others.
- **Color** = how it's actually going, based only on the tags you pick when you check in.

It's not a to-do list. You check in by tapping a plot, picking whatever tags are true right now, and pressing **Tend this land**.

## Look

A dark dashboard with rounded cards, violet and lavender accents, and orange highlights:

- **Overview:** stat cards (areas, % alive, check-ins this week, active days), the map, a "ground balance" donut, and a gradient "worth a look" card that nudges you toward quiet areas.
- **Plot colors:** violet = lush, lavender = mixed, orange = struggling, striped = barren (never checked in).
- **Area screen:** a vitality gauge, an importance slider with a live mini-map, the tag check-in, and the history.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the scoring + layout
npm run build    # static site in dist/ (relative paths, host anywhere)
```

## Your data

Everything is saved in your browser's `localStorage`. Nothing is sent anywhere. Use **Export backup** / **Import** in the map footer to move your map between devices or browsers as a JSON file.

## How it works

| File | What it does |
|---|---|
| `src/model.ts` | Data types, tags, vitality score, streaks, "worth a look", backup validation |
| `src/treemap.ts` | Squarified treemap that sizes plots by importance |
| `src/colors.ts` | Vitality → plot color (orange → lavender → violet) |
| `src/store.ts` | State + localStorage persistence, export/import |
| `src/components/` | Dashboard widgets, map, area detail/check-in, add-area dialog |

See [`docs/SCORING.md`](docs/SCORING.md) for the exact formulas.
