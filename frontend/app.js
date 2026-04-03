const SAMPLE_YAML = `- name: Programming Languages
  description: Popular languages and their ecosystems
  children:
    - name: JavaScript
      description: The language of the web
      children:
        - name: React
          description: UI component library by Meta
        - name: Vue
          description: Progressive framework
        - name: Node.js
          description: Server-side JavaScript runtime
        - name: TypeScript
          description: Typed superset of JavaScript
    - name: Go
      description: Fast compiled systems language
      children:
        - name: Gin
          description: HTTP web framework
        - name: Cobra
          description: CLI application framework
        - name: tcell
          description: Terminal cell library for TUIs
        - name: GORM
          description: ORM library for Go
    - name: Python
      description: Versatile scripting language
      children:
        - name: Django
          description: Full-stack web framework
        - name: FastAPI
          description: Modern async API framework
        - name: NumPy
          description: Numerical computing library
    - name: Rust
      description: Memory-safe systems language
      children:
        - name: Tokio
          description: Async runtime
        - name: Actix
          description: Web framework
        - name: Serde
          description: Serialization framework
- name: Cloud Providers
  description: Major cloud platforms
  children:
    - name: Azure
      description: Microsoft cloud platform
      children:
        - name: Static Web Apps
          description: Serverless frontend hosting
        - name: Container Apps
          description: Managed container runtime
        - name: Cosmos DB
          description: Multi-model database service
        - name: Key Vault
          description: Secrets management
    - name: AWS
      description: Amazon Web Services
      children:
        - name: Lambda
          description: Serverless compute
        - name: S3
          description: Object storage
        - name: EKS
          description: Managed Kubernetes
        - name: DynamoDB
          description: NoSQL database
    - name: GCP
      description: Google Cloud Platform
      children:
        - name: Cloud Run
          description: Serverless containers
        - name: BigQuery
          description: Data warehouse
        - name: GKE
          description: Managed Kubernetes
- name: DevOps Tools
  description: Build, deploy, and monitor
  children:
    - name: CI/CD
      description: Continuous integration and delivery
      children:
        - name: GitHub Actions
          description: Workflow automation
        - name: GitLab CI
          description: Built-in CI pipelines
        - name: Jenkins
          description: Self-hosted automation server
    - name: Infrastructure
      description: Infrastructure as code
      children:
        - name: OpenTofu
          description: Open-source Terraform fork
        - name: Pulumi
          description: IaC with real languages
        - name: Ansible
          description: Configuration management
    - name: Containers
      description: Container orchestration
      children:
        - name: Docker
          description: Container runtime
        - name: Kubernetes
          description: Container orchestration platform
        - name: Helm
          description: Kubernetes package manager
`;

// ── ANSI palette → CSS color mapping ──
// Standard 16-color palette themed for Tokyo Night
const PALETTE = [
  "#15161e", // 0  black
  "#f7768e", // 1  maroon/red
  "#9ece6a", // 2  green
  "#e0af68", // 3  olive/yellow
  "#7aa2f7", // 4  navy/blue
  "#bb9af7", // 5  purple
  "#7dcfff", // 6  teal/cyan
  "#a9b1d6", // 7  silver/light gray
  "#565f89", // 8  gray/dark gray
  "#f7768e", // 9  bright red
  "#9ece6a", // 10 bright green
  "#e0af68", // 11 bright yellow
  "#7aa2f7", // 12 bright blue
  "#bb9af7", // 13 bright magenta
  "#7dcfff", // 14 bright cyan
  "#c0caf5", // 15 bright white
];

// ── ANSI Parser ──
// Parses ANSI-escaped text into an array of {char, fg, bg, bold, italic, dim, underline} per cell.
function parseANSI(ansi) {
  const rows = ansi.split("\n");
  const grid = [];

  for (const row of rows) {
    const cells = [];
    let fg = null;
    let bg = null;
    let bold = false;
    let italic = false;
    let dim = false;
    let underline = false;

    let i = 0;
    while (i < row.length) {
      if (row[i] === "\x1b" && row[i + 1] === "[") {
        // Parse CSI sequence
        let j = i + 2;
        while (j < row.length && row[j] !== "m") j++;
        if (j < row.length) {
          const params = row.slice(i + 2, j).split(";").map(Number);
          let p = 0;
          while (p < params.length) {
            const n = params[p];
            if (n === 0) {
              fg = null; bg = null;
              bold = false; italic = false; dim = false; underline = false;
            } else if (n === 1) { bold = true; }
            else if (n === 2) { dim = true; }
            else if (n === 3) { italic = true; }
            else if (n === 4) { underline = true; }
            else if (n === 7) { /* reverse — swap fg/bg at render time if needed */ }
            else if (n === 9) { /* strikethrough */ }
            else if (n === 22) { bold = false; dim = false; }
            else if (n === 23) { italic = false; }
            else if (n === 24) { underline = false; }
            else if (n >= 30 && n <= 37) { fg = PALETTE[n - 30]; }
            else if (n === 39) { fg = null; }
            else if (n >= 40 && n <= 47) { bg = PALETTE[n - 40]; }
            else if (n === 49) { bg = null; }
            else if (n >= 90 && n <= 97) { fg = PALETTE[n - 90 + 8]; }
            else if (n >= 100 && n <= 107) { bg = PALETTE[n - 100 + 8]; }
            else if (n === 38) {
              if (params[p + 1] === 5) {
                fg = palette256(params[p + 2]);
                p += 2;
              } else if (params[p + 1] === 2) {
                fg = `rgb(${params[p + 2]},${params[p + 3]},${params[p + 4]})`;
                p += 4;
              }
            } else if (n === 48) {
              if (params[p + 1] === 5) {
                bg = palette256(params[p + 2]);
                p += 2;
              } else if (params[p + 1] === 2) {
                bg = `rgb(${params[p + 2]},${params[p + 3]},${params[p + 4]})`;
                p += 4;
              }
            }
            p++;
          }
          i = j + 1;
          continue;
        }
      }
      // Handle surrogate pairs (nerd font icons in supplementary planes)
      const cp = row.codePointAt(i);
      const char = String.fromCodePoint(cp);
      cells.push({ char, fg, bg, bold, italic, dim, underline });
      i += char.length;
    }
    grid.push(cells);
  }
  return grid;
}

// 256-color palette → CSS color
function palette256(n) {
  if (n < 16) return PALETTE[n];
  if (n < 232) {
    // 6x6x6 color cube
    n -= 16;
    const r = Math.floor(n / 36) * 51;
    const g = Math.floor((n % 36) / 6) * 51;
    const b = (n % 6) * 51;
    return `rgb(${r},${g},${b})`;
  }
  // Grayscale ramp
  const v = 8 + (n - 232) * 10;
  return `rgb(${v},${v},${v})`;
}

// ── Renderer ──
// Takes a parsed grid and renders it into the terminal <pre> element.
function renderGrid(grid, cursorX, cursorY) {
  const pre = document.getElementById("terminal");
  const frag = document.createDocumentFragment();

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    let i = 0;
    while (i < row.length) {
      const start = i;
      const cell = row[i];
      const isCursorCell = (y === cursorY && i === cursorX);

      i++; // always consume at least one cell

      // Extend the run if this isn't the cursor cell (cursor gets its own span)
      if (!isCursorCell) {
        while (
          i < row.length &&
          row[i].fg === cell.fg &&
          row[i].bg === cell.bg &&
          row[i].bold === cell.bold &&
          row[i].italic === cell.italic &&
          row[i].dim === cell.dim &&
          row[i].underline === cell.underline &&
          !(y === cursorY && i === cursorX)
        ) {
          i++;
        }
      }

      const span = document.createElement("span");
      let text = "";
      for (let j = start; j < i; j++) {
        text += row[j].char;
      }
      span.textContent = text;

      const styles = [];
      if (cell.fg) styles.push(`color:${cell.fg}`);
      if (cell.bg) styles.push(`background:${cell.bg}`);
      if (cell.bold) styles.push("font-weight:bold");
      if (cell.italic) styles.push("font-style:italic");
      if (cell.dim) styles.push("opacity:0.6");
      if (cell.underline) styles.push("text-decoration:underline");

      if (isCursorCell) {
        styles.push("background:var(--cursor)");
        styles.push("color:var(--bg-panel)");
      }

      if (styles.length > 0) {
        span.setAttribute("style", styles.join(";"));
      }
      frag.appendChild(span);
    }
    if (y < grid.length - 1) {
      frag.appendChild(document.createTextNode("\n"));
    }
  }

  pre.innerHTML = "";
  pre.appendChild(frag);
}

// ── Font metrics ──
let cachedCharSize = null;

function measureChar() {
  if (cachedCharSize) return cachedCharSize;

  // Measure using a dedicated off-screen element to avoid layout interference
  const probe = document.createElement("pre");
  probe.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;white-space:pre;" +
    "font-family:var(--terminal-font);font-size:14px;line-height:1.2;" +
    "padding:0;margin:0;border:0";
  probe.textContent = "MMMMMMMMMM"; // 10 chars for better averaging
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  document.body.removeChild(probe);

  const w = rect.width / 10;
  const h = rect.height;

  if (w >= 4 && h >= 8) {
    cachedCharSize = { w, h };
    return cachedCharSize;
  }
  // Fallback for monospace 14px
  return { w: 8.4, h: 16.8 };
}

function computeGridSize() {
  const container = document.getElementById("terminal");
  const rect = container.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    return { cols: 80, rows: 24 };
  }
  const char = measureChar();
  const cols = Math.min(Math.max(Math.floor(rect.width / char.w), 20), 250);
  const rows = Math.min(Math.max(Math.floor(rect.height / char.h), 5), 80);
  return { cols, rows };
}

// ── Key translator ──
// Maps browser keydown event to args for fzh.handleKey(key, ctrl, shift)
function shouldForwardKey(e) {
  // Don't forward if focus is in the YAML editor
  if (document.activeElement === document.getElementById("yaml-editor")) {
    return false;
  }
  // Forward printable characters, arrows, and control keys
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) return true;
  if (e.ctrlKey && "aAeEuUwWpPnNcC".includes(e.key)) return true;
  const special = [
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Enter", "Escape", "Backspace", "Delete", "Tab", "Home", "End",
  ];
  return special.includes(e.key);
}

// ── Main ──
let rendering = false;
let lastGridSize = null;

function renderFrame(result) {
  if (!result || result instanceof Error) return;
  if (rendering) return;
  rendering = true;
  try {
    const grid = parseANSI(result.ansi);
    renderGrid(grid, result.cursorX, result.cursorY);
  } finally {
    rendering = false;
  }
}

async function init() {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch("fzh.wasm"),
    go.importObject
  );
  go.run(result.instance);

  document.getElementById("loading").classList.add("hidden");

  const editor = document.getElementById("yaml-editor");
  editor.value = SAMPLE_YAML;

  // Load YAML and init session
  applyYAML();

  // YAML editor buttons
  document.getElementById("btn-sample").addEventListener("click", () => {
    editor.value = SAMPLE_YAML;
    applyYAML();
  });
  document.getElementById("btn-apply").addEventListener("click", () => {
    applyYAML();
  });

  // Key handling — listen on document, forward to WASM when terminal is focused
  document.addEventListener("keydown", (e) => {
    if (!shouldForwardKey(e)) return;
    e.preventDefault();

    try {
      const result = fzh.handleKey(e.key, e.ctrlKey, e.shiftKey);
      if (result instanceof Error) {
        console.error("fzh.handleKey error:", result.message);
        return;
      }
      renderFrame(result);
    } catch (err) {
      console.error("handleKey threw:", err);
    }
  });

  // Focus management
  document.getElementById("terminal").addEventListener("click", () => {
    termFocused = true;
    document.getElementById("yaml-editor").blur();
  });

  document.getElementById("yaml-editor").addEventListener("focus", () => {
    termFocused = false;
  });

  // Responsive resize — only re-render when grid dimensions actually change
  const ro = new ResizeObserver(() => {
    try {
      const { cols, rows } = computeGridSize();
      const key = cols + "x" + rows;
      if (key === lastGridSize) return;
      lastGridSize = key;
      const result = fzh.resize(cols, rows);
      if (result instanceof Error) {
        console.error("fzh.resize error:", result.message);
        return;
      }
      renderFrame(result);
    } catch (err) {
      console.error("resize threw:", err);
    }
  });
  ro.observe(document.getElementById("terminal"));
}

function applyYAML() {
  const yaml = document.getElementById("yaml-editor").value;
  const loadResult = fzh.loadYAML(yaml);
  if (loadResult instanceof Error) {
    showError(loadResult.message);
    return;
  }
  const { cols, rows } = computeGridSize();
  lastGridSize = cols + "x" + rows;
  const result = fzh.init(cols, rows);
  if (result instanceof Error) {
    showError(result.message);
    return;
  }
  renderFrame(result);
}

function showError(msg) {
  const pre = document.getElementById("terminal");
  pre.textContent = "Error: " + msg;
}

init();
