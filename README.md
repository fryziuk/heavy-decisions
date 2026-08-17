# Heavy Decisions / Важкі рішення

A workout logger for **two full-body sessions a week** of low-volume, high-effort
training: **two straight working sets** per exercise — same weight, same rep range,
taken to about **2 reps in reserve** with controlled execution.
Roughly 12 hard sets per session — it fits in an hour.

Built for the phone: install it to your iPhone home screen, use it offline in the gym,
and your data never leaves the device. The interface, install name, and app icon switch
between English and Ukrainian.

## Why it's built this way

| Decision | Reason |
| --- | --- |
| Two sets per exercise | Intensity over volume: two productive sets at ~2 RIR beat piling on fatigued work (a top-set + back-off structure is available per slot). |
| Full body A/B, not upper/lower | With only two sessions a week, a split would hit each muscle once. Full body trains everything twice. |
| Slots, not fixed exercises | Each slot ("Quads", "Vertical Pull") holds the variations you rotate between. Swap mid-session; history follows the *exercise*, so progression stays correct. |
| No account, no server | Works with no signal. Nothing to log into mid-set. |

## Using it

**Train** — one big button starts whichever day is up next. Log each set: weight, reps,
and reps in reserve (RIR; steppers, no typing needed). Tapping **+** stores the set and starts the rest timer.
A session clock runs against your 60-minute target and turns red when you go over; header
buttons **pause** the clock (rest timer freezes too) or **stop** and save the session.
Each exercise shows a short form cue and a **▶** button that opens YouTube form tutorials
for whatever variation is currently picked.

**Progression** is double progression: clear the top of the rep range at the prescribed
RIR on both straight sets and the app adds that exercise's increment next time, shown as
`target 122.5kg ▲`. (Top-set + back-off slots use the top set.) Each slot
also shows what you did last time and your best-ever top set.

**Body** — log bodyweight, see a trend line, 7-day average and all-time change.

**Program** — rename days, add/remove/reorder slots, edit rep ranges and increments,
choose straight vs rest-pause back-offs, and add your own exercises.

**Data** — settings for units, rest periods and session target, plus backup.

## Back up your data

Data lives on the device in two copies — localStorage plus an IndexedDB mirror; on
launch the newer copy wins, so an evicted cache self-heals. The app also requests
persistent storage from the browser. Losing the phone still loses the data, so the
**Data** tab exports a `.json` backup (download or clipboard) and restores from one —
imports are validated and sanitized before anything is overwritten.
Installing to the home screen makes storage considerably more durable than a browser tab.

## Install on iPhone

Open the site in Safari → **Share** → **Add to Home Screen**. It launches full-screen
and works with no connection.

## The default program

**Day A** — Quads · Horizontal Push · Horizontal Pull · Hamstrings · Side Delts · Triceps
**Day B** — Hinge · Vertical Pull · Vertical Push · Quads · Biceps · Calves

Defaults follow Paul Carter's low-volume, high-effort approach while matching rep ranges
to the movement: 6–10 for most compounds, 8–12 for isolations, and 10–15 for lateral
raises. Sets finish near 2 RIR with enough rest to keep the second set productive.
First-session weights are personalized from a 100 kg × 5 bench and 100 kg × 8 squat;
machine-stack targets are deliberately conservative calibration guesses.
No drop sets, giant sets, or finishers. Each slot's second set can be straight,
rest-pause (RP), or lengthened partials (LP), and
any slot can be switched to a classic **top set + back-off** structure in the Program
tab.

Every slot is editable; nothing here is load-bearing.

## Running locally

No build step, no dependencies.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

A service worker caches the shell for offline use. It's network-first, so a deploy is
picked up as soon as there's signal — bump `CACHE` in `sw.js` when you change the code.

## Files

| File | Role |
| --- | --- |
| `index.html` | Shell: header, session clock, rest bar, tab bar |
| `app.js` | State, progression logic, all five views |
| `styles.css` | Dark theme, 46px touch targets, safe-area aware |
| `sw.js` | Offline cache |
| `manifest.webmanifest` | Home-screen install metadata |

## Licence

MIT — see [LICENSE](LICENSE).
