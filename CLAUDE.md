# fzt-showcase

Interactive web demo of [fzt](https://github.com/nelsong6/fzt-terminal) (fuzzy hierarchical finder). Runs the actual Go scoring engine via WASM in the browser.

No auth. Frontend-only (no backend, no database). Will eventually be absorbed into my-homepage.

## Architecture

- **WASM bridge** lives in `fzt/cmd/wasm/main.go` — compiles fzt's full TUI renderer, scorer, YAML loader, and event handling into a `.wasm` binary. Exposes a stateful session: `init(cols, rows)`, `handleKey(key, ctrl, shift)`, `resize(cols, rows)` — returns ANSI-escaped frames + cursor position.
- **Frontend** is vanilla HTML/CSS/JS in `frontend/` — the entire page is a windowless DOS terminal session. A JS-rendered command history (`type README.TXT`, `dir /B *.LNK`, `fzt.exe`) provides context and navigation links above the TUI output. CRT effects (scanlines, vignette, barrel distortion) overlay the content. DOS pixel font, phosphor green glow, blinking cursor. No title bar or window chrome — the terminal appears directly on the dark background. YAML editor lives in a slide-out drawer toggled via a link in the command history. Leaf selection opens URLs in new tabs.
- **Build** copies static files + WASM binary to `dist/`; the WASM is downloaded from fzt-terminal releases during CI
- **Nerd font support**: Self-hosted `SymbolsNerdFontMono-Regular.ttf` provides fallback glyphs for nerd font icons (folder/file). Icon spans get explicit `font-family` assignment and are rendered as `inline-block` at exactly `2×charW` pixels to match Go/tcell's double-width cell allocation. The ANSI parser marks wide characters (codepoint > U+FFFF) and merges each icon with its tcell padding cell into a single span.
- **DOS font**: Self-hosted `PerfectDOSVGA437.ttf` (Perfect DOS VGA 437) is the primary terminal font, giving the demo an authentic MS-DOS retro look. Font smoothing is disabled for crisp pixel rendering.

## Ambience integration

`<canvas id="ambience-canvas" data-ambience>` sits before `.page` in the body and gets rain drops painted behind the DOS terminal. Canvas is `position: fixed; z-index: 0; pointer-events: none`; `.page` at `z-index: 1` so it sits above. `--fzt-bg` overridden to `transparent` under `body.ambience-on` so drops show through the terminal area — text glyphs rasterize opaque on top, cells with explicit bg (highlighted rows) block rain naturally. Uses the shared `ambience-sim.js` + `ambience-client.js` (vendored from `ambience` repo at `cmd/ambience/web/`); the client auto-inits on any `<canvas data-ambience>` and adds `body.ambience-on` on success — if ambience JS fails to fetch, the terminal keeps its solid bg and doesn't render broken. Entropy: keystrokes POSTed to `ambience.romaine.life/entropy` every 2s.

The vendored ambience files must be kept in sync when upstream `ambience` sim/client change; copy from `/d/repos/ambience/cmd/ambience/web/`.

## Building

WASM binary (from fzt-terminal repo, for local dev):
```
cd /d/repos/fzt && GOOS=js GOARCH=wasm go build -o /d/repos/fzt-showcase/frontend/fzt.wasm ./cmd/wasm
```

Frontend:
```
cd frontend && npm ci && npm run build
```

## Relationship to my-homepage

Both consume fzt-browser's WASM binary and JS/CSS assets. The showcase is a standalone demo (no auth, no backend, hardcoded bookmarks in command history); my-homepage is a full bookmark manager with auth, API, blob storage, and the ref system. A new fzt-browser release does not auto-redeploy either consumer — retrigger manually (`gh workflow run deploy.yml -R nelsong6/fzt-showcase`) to pick up fresh assets. The showcase will eventually be absorbed into my-homepage.

## Deployment

Azure Static Web App via GitHub Actions. CI downloads `fzt.wasm` from the latest fzt-terminal release, then deploys `frontend/dist/`.
