# Local AI Dashboard

An animated network diagram for your home lab / local AI fleet. Machine cards,
glowing wires with traffic packets, a spotlight mode for walking through each
box, and a memory-comparison panel — rendered on a fixed 1920×1080 stage that
scales to any window, so it records cleanly for video.

No build step, no server, no dependencies: open `index.html` straight from
disk and it works.

## Quick start

1. Clone (or just download) this repo
2. Open `index.html` in a browser — you'll see the example lab
3. Edit `configs/example.js` to describe *your* machines

Everything on screen — names, colors, positions, chips, wires, labels, memory
bars, header text — lives in that one config file. The renderer draws whatever
is there.

```
index.html          shell — picks a scene via ?scene=<name>
app/styles.css      presentation (colors/positions flow in from the config)
app/app.js          generic renderer: cards, wires, labels, bars, hotkeys
configs/example.js  the scene data — start here
```

## Multiple scenes

Keep one config per diagram and switch with a URL parameter:

```
configs/example.js   →  index.html               (default)
configs/studio.js    →  index.html?scene=studio
```

Handy for episodes/versions of the same lab, or before/after comparisons.

## Adding a machine

One entry in `machines:` is the card, one line in `links:` is its wire —
the wire routes itself to the hero card in the machine's color, and the
hotkey, hint bar, intro cascade, and spotlight all pick it up automatically:

```js
// machines:
{ id: "pi", key: "6", color: "#3fb6a8",
  x: 108, y: 872,
  name: "RASPBERRY PI", role: "EDGE",
  spec: "Pi 5 · 8 GB RAM",
  chips: ["Home Assistant", "whisper.cpp"],
  foot: ["Linux", "always on"] },

// links:
{ from: "pi", packets: [{ dur: 5.5, begin: 0.5, r: 4 }] },
```

`hero: true` marks the big center card — the pulse ring, stat chips, and
wire hub follow it. Custom wire routes (like the example's Wake-on-LAN arc)
take an explicit SVG `path`. Omit the `memory:` block to drop the bottom
panel entirely.

## Controls

| Key | Action |
|---|---|
| `1`–`9` | spotlight a machine (dims everything else) |
| `0` / `Esc` | clear the spotlight |
| `R` | replay the intro animation |
| `F` | fullscreen |
| `H` | toggle the hint bar (auto-hides after 9 s) |

URL parameters, combinable: `?scene=<name>` picks the config,
`?still` freezes all animation (thumbnails/stills), `?focus=<id>` starts
with a machine spotlighted — e.g. `index.html?still&focus=server`.
