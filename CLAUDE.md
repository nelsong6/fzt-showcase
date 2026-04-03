# fuzzy-tiers-showcase

Interactive web demo of [fzh](https://github.com/nelsong6/fuzzy-tiered) (fuzzy hierarchical finder). Runs the actual Go scoring engine via WASM in the browser.

No auth. Frontend-only (no backend, no database). Will eventually be absorbed into my-homepage.

## Architecture

- **WASM bridge** lives in `fuzzy-tiered/cmd/wasm/main.go` — compiles fzh's internal scorer, YAML loader, and filtering into a `.wasm` binary
- **Frontend** is vanilla HTML/CSS/JS in `frontend/` — loads the WASM, provides a terminal-like split-pane UI (YAML editor + fuzzy finder)
- **Build** copies static files + WASM binary to `dist/`; the WASM is built from the fuzzy-tiered repo during CI

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
