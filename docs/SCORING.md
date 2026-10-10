# How colors are decided

Color comes only from what you said in check-ins, never from how often you open the app.

## One check-in

Each tag has a weight. Custom tags you invent are neutral (0).

| Tag | Weight | Tag | Weight |
|---|---|---|---|
| ahead, shipped something | +1.0 | behind, plateaued, needs attention | −0.3 |
| on track, enjoying it, growing | +0.8 | draining | −0.6 |
| neutral, low priority right now | 0 | resentful | −0.7 |
| | | stalled, want to quit | −1.0 |

`score = 0.5 + spread × clamp(sum of weights, −1, 1)`, where `spread` is 0.5 normally and 0.2 when the check-in has
both positive and negative tags. That makes `on track` + `resentful` read as **mixed**, not positive.

## An area's vitality (0–100%)

1. Take the last 5 check-ins and average their scores, weighting each by recency (14-day half-life).
2. If the result is positive, it fades back toward the middle the longer you've been quiet (`× e^(−days/30)`).
   Bad news doesn't fade: it stays until you say otherwise.

| Vitality | State |
|---|---|
| no check-ins | barren |
| ≥ 65% | lush |
| 30–65% | mixed |
| < 30% | struggling |

The color itself is a continuous blend, so a 64% plot looks almost lush.

## Other numbers

- **"X% of it is alive"**: the average vitality weighted by importance. Barren plots count as 0.
- **Streak**: how many of your most recent check-ins in a row scored ≥ 65%. It's shown from 2× upward.
- **Worth a look**: up to 3 areas you haven't checked in on for more than 7 days, with never-checked-in areas first. This list never changes a color.
