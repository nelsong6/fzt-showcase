# fuzzy-tiers-showcase

Interactive web demo of [fzh](https://github.com/nelsong6/fuzzy-tiered) (fuzzy hierarchical finder). Runs the actual Go scoring engine via WASM in the browser.

No auth. Frontend-only (no backend, no database). Will eventually be absorbed into my-homepage.

## Architecture

- **WASM bridge** lives in `fuzzy-tiered/cmd/wasm/main.go` — compiles fzh's full TUI renderer, scorer, YAML loader, and event handling into a `.wasm` binary. Exposes a stateful session: `init(cols, rows)`, `handleKey(key, ctrl, shift)`, `resize(cols, rows)` — returns ANSI-escaped frames + cursor position.
- **Frontend** is vanilla HTML/CSS/JS in `frontend/` — a terminal element (`<pre>`) renders ANSI frames from the Go TUI, producing output identical to the terminal version. The JS side is a dumb pipe: font metrics → grid dimensions, browser keydown → tcell key translation, ANSI string → styled DOM spans.
- **Build** copies static files + WASM binary to `dist/`; the WASM is built from the fuzzy-tiered repo during CI
- **Nerd font support**: Self-hosted `SymbolsNerdFontMono-Regular.ttf` provides fallback glyphs for nerd font icons (folder/file). Listed as CSS fallback font so primary monospace font handles text and the symbols font fills in icon codepoints.

## Building

WASM binary (from fuzzy-tiered repo):
```
GOOS=js GOARCH=wasm go build -o frontend/fzh.wasm ./cmd/wasm
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
