# Neon Skillet — Midnight Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/chipuystar/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/chipuystar/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original browser cooking game: you are Chef Nova, running the
brightest kitchen on the street for one 3-minute shift. Tickets fly in on the
order board, you chop, grill and fry your way through five original recipes,
plate them and serve before patience runs out — while Chef Vex, the rival
across the street, feeds on every expired order.

## Run it

```sh
# Serve the game folder with any static server, then open game/index.html
python3 -m http.server --directory game 8080
```

Play with keyboard and mouse: **WASD / arrows** move, **click** a station to
walk to it and use it, **E** interact, **Q** bin what you carry, **P** pause,
**M** mute. Everything is drawn in code and every sound is synthesized with
WebAudio — the game loads no network resource at all.

## How it plays

One 180-second shift, three phases that speed up as the night goes on:

| Phase | At | New orders | Patience | Tips |
| --- | --- | --- | --- | --- |
| Dinner Rush | 3:00 | every 11 s | 55 s | ×1.0 |
| Neon Rush | 2:00 | every 8.5 s | 48 s | ×1.25 |
| Midnight Rush | 1:00 | every 6.5 s | 42 s | ×1.5 |

Five recipes, from Golden Fries ($8) to Ember Steak ($16). Grab ingredients
from the 8 crates, chop on 2 boards, grill or fry on 2 slots each (watch the
timer — food burns), stack it on one of 3 plates and serve at the green
window. Serve 3 in a row for a $5 combo bonus; let a ticket expire and you
lose $5 and Chef Vex's hype grows. Hit $60 / $120 / $180 for 1 / 2 / 3 stars.

---

<sub>Entered on [make.fun](https://make.fun/?ref=0cyw4zjw&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
