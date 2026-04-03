# fuzzy-tiers-showcase

Interactive web demo of [fzt](https://github.com/nelsong6/fuzzy-tiered) (fuzzy hierarchical finder). Runs the actual Go scoring engine via WASM in the browser.

No auth. Frontend-only (no backend, no database). Will eventually be absorbed into my-homepage.

## Architecture

- **WASM bridge** lives in `fuzzy-tiered/cmd/wasm/main.go` — compiles fzt's full TUI renderer, scorer, YAML loader, and event handling into a `.wasm` binary. Exposes a stateful session: `init(cols, rows)`, `handleKey(key, ctrl, shift)`, `resize(cols, rows)` — returns ANSI-escaped frames + cursor position.
- **Frontend** is vanilla HTML/CSS/JS in `frontend/` — the entire page is a windowless DOS terminal session. A JS-rendered command history (`type README.TXT`, `dir /B *.LNK`, `fzt.exe`) provides context and navigation links above the TUI output. CRT effects (scanlines, vignette, barrel distortion) overlay the content. DOS pixel font, phosphor green glow, blinking cursor. No title bar or window chrome — the terminal appears directly on the dark background. YAML editor lives in a slide-out drawer toggled via a link in the command history. Leaf selection opens URLs in new tabs.
- **Build** copies static files + WASM binary to `dist/`; the WASM is built from the fuzzy-tiered repo during CI
- **Nerd font support**: Self-hosted `SymbolsNerdFontMono-Regular.ttf` provides fallback glyphs for nerd font icons (folder/file). Icon spans get explicit `font-family` assignment and are rendered as `inline-block` at exactly `2×charW` pixels to match Go/tcell's double-width cell allocation. The ANSI parser marks wide characters (codepoint > U+FFFF) and merges each icon with its tcell padding cell into a single span.
- **DOS font**: Self-hosted `PerfectDOSVGA437.ttf` (Perfect DOS VGA 437) is the primary terminal font, giving the demo an authentic MS-DOS retro look. Font smoothing is disabled for crisp pixel rendering.

## Building

WASM binary (from fuzzy-tiered repo):
```
GOOS=js GOARCH=wasm go build -o frontend/fzt.wasm ./cmd/wasm
```

Frontend:
```
cd frontend && npm ci && npm run build
```

## Deployment

Azure Static Web App via GitHub Actions. CI checks out fuzzy-tiered, builds WASM, then deploys `frontend/dist/`.

## Change Log

### 2026-04-02

- Initial scaffold: WASM bridge in fuzzy-tiered, vanilla frontend with Tokyo Night theme, sample YAML tree, drill-down navigation
- **Terminal-faithful rendering**: Replaced CSS-based result rendering with a true terminal emulator model. The Go TUI now renders onto a headless MemScreen via the same `renderFrame` pipeline used in the terminal, serializes to ANSI, and the JS side parses and renders as styled `<span>` elements in a `<pre>`. Column alignment, nerd font icons, selection indicators, breadcrumb placement, and borders now match the terminal exactly.
- **Full interactivity via Go event loop**: Browser keydown events are translated to tcell key constants and forwarded to the Go TUI's `handleKeyEvent`. All interaction logic (typing, navigation, drill-down, scope management, scroll offset) lives in Go — the JS side is stateless. New keybinds or features added to the terminal version flow through to the web automatically.
- **Responsive terminal dimensions**: JS measures font metrics (character width/height), computes cols × rows from the container size, and passes to Go. ResizeObserver triggers re-render on window resize. Grid dimensions clamped to safe maximums (250×80 JS, 500×200 Go).
- **Nerd font support**: Added self-hosted Symbols Nerd Font Mono (TTF) as CSS fallback font for nerd font icons (folder U+F024B, file U+F016).
- **ANSI parser**: JS parser handles full SGR: 16-color palette mapped to Tokyo Night theme, 256-color, RGB true color, bold/italic/dim/underline attributes. Surrogate-pair safe for supplementary-plane Unicode.
- **Leaf selection opens URLs**: Sample YAML items now carry real documentation URLs. Enter on a leaf opens the URL in a new tab via `window.open()`. The Go WASM bridge returns the URL alongside the "select" action.
- **Terminal-first redesign**: Terminal is now the hero element — macOS-style window chrome with traffic lights, rounded corners, drop shadow. YAML editor moved from a 40% side panel to a slide-out drawer toggled from the title bar. Added hero text ("fzt — A fuzzy finder with hierarchical navigation") so visitors understand the page at a glance.
- **Deploy fix**: Added `SymbolsNerdFontMono-Regular.ttf` to the `cp` step in `deploy.yml` so the nerd font ships with the static site.
- **Wide character rendering fix**: Nerd font icons (supplementary-plane codepoints > U+FFFF) caused row overflow because the browser rendered them wider than a single monospace cell. The ANSI parser now marks wide characters, merges each icon + its tcell padding cell into a single `inline-block` span constrained to exactly `2×charW` pixels. Icon spans explicitly request Symbols Nerd Font Mono as primary font (fixes Firefox fallback). `vertical-align:bottom` and `line-height:1.2` prevent inline-block from inflating row height. Rows wrapped in `<div>` elements so block-level backgrounds fill the fractional pixel gap at the container's right edge.
- **Retro CRT terminal redesign**: Replaced macOS-style chrome (traffic lights, rounded corners, drop shadow) with a Windows/MSDOS retro aesthetic: sharp corners, `C:\>` prompt icon, Windows-style minimize/maximize/close buttons, thin border. Added CRT scanline overlay via repeating-gradient pseudo-element. Phosphor green accent color with text-shadow glow on hero title and prompt. Tagline switched from sans-serif to monospace.
- **DOS pixel font**: Added self-hosted Perfect DOS VGA 437 (TTF) as the primary terminal font. Font smoothing disabled (`-webkit-font-smoothing: none`) for authentic pixel rendering. Font size bumped from 14px to 16px to match the font's native pixel grid.
- **GitHub links in hero**: Added two links below the tagline — "GitHub" pointing to the main fzt tool repo (`nelsong6/fuzzy-tiered`) and "Source" pointing to the showcase repo (`nelsong6/fuzzy-tiers-showcase`). Styled with retro green color and phosphor glow on hover.

### 2026-04-03

- **CRT barrel distortion + vignette**: Added subtle rounded corners (`12px/14px`), radial-gradient vignette darkening at edges, and `inset box-shadow` for CRT depth. Scanline overlay preserved and composited with the vignette.
- **Blinking MSDOS cursor**: CSS `blink` animation (`step-end`, 1s) on cursor span. When Go returns cursor position -1,-1 (hidden), JS defaults to the prompt position (col 3, row 1) so the cursor always blinks at the input point.
- **Windowless terminal**: Removed all window chrome (title bar, minimize/maximize/close buttons, window border). The terminal content renders directly on the dark background with no frame, giving the impression of a raw DOS session.
- **Full DOS session page**: Replaced the hero section entirely with JS-rendered DOS command history inside the terminal `<pre>`. The page now reads as a complete terminal session: `type README.TXT` outputs the description, `dir /B *.LNK` outputs clickable GitHub/Source/YAML links, and `fzt.exe` launches the TUI. No HTML outside the terminal — everything is command-line output.
- **fzt.exe**: The command history shows `fzt.exe` (not `fzt`) for authentic DOS flavor.
