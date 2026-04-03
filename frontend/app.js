const SAMPLE_YAML = `- name: Programming Languages
  description: Popular languages and their ecosystems
  children:
    - name: JavaScript
      description: The language of the web
      url: https://developer.mozilla.org/en-US/docs/Web/JavaScript
      children:
        - name: React
          description: UI component library by Meta
          url: https://react.dev
        - name: Vue
          description: Progressive framework
          url: https://vuejs.org
        - name: Node.js
          description: Server-side JavaScript runtime
          url: https://nodejs.org
        - name: TypeScript
          description: Typed superset of JavaScript
          url: https://www.typescriptlang.org
    - name: Go
      description: Fast compiled systems language
      url: https://go.dev
      children:
        - name: Gin
          description: HTTP web framework
          url: https://gin-gonic.com
        - name: Cobra
          description: CLI application framework
          url: https://github.com/spf13/cobra
        - name: tcell
          description: Terminal cell library for TUIs
          url: https://github.com/gdamore/tcell
        - name: GORM
          description: ORM library for Go
          url: https://gorm.io
    - name: Python
      description: Versatile scripting language
      url: https://www.python.org
      children:
        - name: Django
          description: Full-stack web framework
          url: https://www.djangoproject.com
        - name: FastAPI
          description: Modern async API framework
          url: https://fastapi.tiangolo.com
        - name: NumPy
          description: Numerical computing library
          url: https://numpy.org
    - name: Rust
      description: Memory-safe systems language
      url: https://www.rust-lang.org
      children:
        - name: Tokio
          description: Async runtime
          url: https://tokio.rs
        - name: Actix
          description: Web framework
          url: https://actix.rs
        - name: Serde
          description: Serialization framework
          url: https://serde.rs
- name: Cloud Providers
  description: Major cloud platforms
  children:
    - name: Azure
      description: Microsoft cloud platform
      url: https://azure.microsoft.com
      children:
        - name: Static Web Apps
          description: Serverless frontend hosting
          url: https://learn.microsoft.com/en-us/azure/static-web-apps/
        - name: Container Apps
          description: Managed container runtime
          url: https://learn.microsoft.com/en-us/azure/container-apps/
        - name: Cosmos DB
          description: Multi-model database service
          url: https://learn.microsoft.com/en-us/azure/cosmos-db/
        - name: Key Vault
          description: Secrets management
          url: https://learn.microsoft.com/en-us/azure/key-vault/
    - name: AWS
      description: Amazon Web Services
      url: https://aws.amazon.com
      children:
        - name: Lambda
          description: Serverless compute
          url: https://aws.amazon.com/lambda/
        - name: S3
          description: Object storage
          url: https://aws.amazon.com/s3/
        - name: EKS
          description: Managed Kubernetes
          url: https://aws.amazon.com/eks/
        - name: DynamoDB
          description: NoSQL database
          url: https://aws.amazon.com/dynamodb/
    - name: GCP
      description: Google Cloud Platform
      url: https://cloud.google.com
      children:
        - name: Cloud Run
          description: Serverless containers
          url: https://cloud.google.com/run
        - name: BigQuery
          description: Data warehouse
          url: https://cloud.google.com/bigquery
        - name: GKE
          description: Managed Kubernetes
          url: https://cloud.google.com/kubernetes-engine
- name: DevOps Tools
  description: Build, deploy, and monitor
  children:
    - name: CI/CD
      description: Continuous integration and delivery
      children:
        - name: GitHub Actions
          description: Workflow automation
          url: https://github.com/features/actions
        - name: GitLab CI
          description: Built-in CI pipelines
          url: https://docs.gitlab.com/ee/ci/
        - name: Jenkins
          description: Self-hosted automation server
          url: https://www.jenkins.io
    - name: Infrastructure
      description: Infrastructure as code
      children:
        - name: OpenTofu
          description: Open-source Terraform fork
          url: https://opentofu.org
        - name: Pulumi
          description: IaC with real languages
          url: https://www.pulumi.com
        - name: Ansible
          description: Configuration management
          url: https://www.ansible.com
    - name: Containers
      description: Container orchestration
      children:
        - name: Docker
          description: Container runtime
          url: https://www.docker.com
        - name: Kubernetes
          description: Container orchestration platform
          url: https://kubernetes.io
        - name: Helm
          description: Kubernetes package manager
          url: https://helm.sh
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
      const wide = cp > 0xFFFF;
      cells.push({ char, fg, bg, bold, italic, dim, underline, wide });
      i += char.length;
    }
    // Mark padding cells after double-width characters so the renderer can
    // merge icon + padding into a single 2ch span.
    for (let j = 0; j < cells.length; j++) {
      if (cells[j].wide && j + 1 < cells.length && cells[j + 1].char === " ") {
        cells[j + 1].widePad = true;
      }
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

  // DOS command history — builds the illusion of a real terminal session
  const history = [
    { cmd: "type README.TXT", output: "fzh \u2014 A fuzzy finder with hierarchical navigation.\nType to search, arrow keys to navigate, Enter to drill in or open." },
    { cmd: "dir /B *.LNK", links: [
      { text: "GitHub", href: "https://github.com/nelsong6/fuzzy-tiered" },
      { text: "Source", href: "https://github.com/nelsong6/fuzzy-tiers-showcase" },
      { text: "YAML", id: "btn-toggle-yaml" },
    ]},
    { cmd: "fzh.exe" },
  ];

  for (const entry of history) {
    // Prompt + command line
    const cmdDiv = document.createElement("div");
    cmdDiv.className = "cmd-history";
    const p = document.createElement("span");
    p.textContent = "C:\\> ";
    p.style.color = "var(--fg-dim)";
    cmdDiv.appendChild(p);
    const c = document.createElement("span");
    c.textContent = entry.cmd;
    c.style.color = "var(--accent)";
    cmdDiv.appendChild(c);
    frag.appendChild(cmdDiv);

    // Output lines (plain text, may be multiline)
    if (entry.output) {
      for (const line of entry.output.split("\n")) {
        const outDiv = document.createElement("div");
        outDiv.className = "cmd-output";
        outDiv.textContent = line;
        frag.appendChild(outDiv);
      }
    }

    // Output line (links)
    if (entry.links) {
      const outDiv = document.createElement("div");
      outDiv.className = "cmd-output";
      entry.links.forEach((link, i) => {
        if (i > 0) outDiv.appendChild(document.createTextNode("  "));
        if (link.href) {
          const a = document.createElement("a");
          a.href = link.href;
          a.target = "_blank";
          a.textContent = link.text;
          a.className = "cmd-link";
          outDiv.appendChild(a);
        } else if (link.id) {
          const btn = document.createElement("button");
          btn.id = link.id;
          btn.textContent = link.text;
          btn.className = "cmd-link-btn";
          outDiv.appendChild(btn);
        }
      });
      frag.appendChild(outDiv);
    }
  }

  // Blank line before TUI output
  frag.appendChild(document.createElement("div"));

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    const rowDiv = document.createElement("div");
    let lastBg = null;
    let i = 0;
    while (i < row.length) {
      const start = i;
      const cell = row[i];
      const isCursorCell = (y === cursorY && i === cursorX);

      i++; // always consume at least one cell

      // Wide char: also consume its padding cell into the same span
      if (cell.wide && i < row.length && row[i].widePad) {
        i++;
      }
      // Extend the run if this isn't the cursor cell (cursor gets its own span)
      // Wide characters and their padding get their own span
      else if (!isCursorCell && !cell.wide) {
        while (
          i < row.length &&
          !row[i].wide &&
          !row[i].widePad &&
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
      if (cell.wide) styles.push("display:inline-block;width:calc(2 * var(--char-w));overflow:hidden;text-align:center;font-family:'Symbols Nerd Font Mono',var(--terminal-font);vertical-align:bottom;line-height:1.2");

      if (isCursorCell) {
        styles.push("background:var(--cursor)");
        styles.push("color:var(--bg-panel)");
        span.className = "cursor";
        lastBg = "var(--cursor)";
      } else {
        lastBg = cell.bg;
      }

      if (styles.length > 0) {
        span.setAttribute("style", styles.join(";"));
      }
      rowDiv.appendChild(span);
    }
    // Extend the last cell's background to fill the fractional pixel gap
    if (lastBg) {
      rowDiv.style.background = lastBg;
    }
    frag.appendChild(rowDiv);
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
    "font-family:var(--terminal-font);font-size:16px;line-height:1.2;" +
    "padding:0;margin:0;border:0";
  probe.textContent = "MMMMMMMMMM"; // 10 chars for better averaging
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  document.body.removeChild(probe);

  const w = rect.width / 10;
  const h = rect.height;

  if (w >= 4 && h >= 8) {
    cachedCharSize = { w, h };
    // Expose as CSS custom property for use in inline styles on icon spans
    document.documentElement.style.setProperty("--char-w", w + "px");
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
    // When Go hides the cursor (-1,-1), place a blinking cursor at the
    // prompt position (after "│> ") for the MSDOS aesthetic.
    let cx = result.cursorX;
    let cy = result.cursorY;
    if (cx < 0 || cy < 0) {
      cx = 3; // after "│> "
      cy = 1; // prompt row (row 0 is top border)
    }
    renderGrid(grid, cx, cy);
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

  // YAML drawer toggle
  const drawer = document.getElementById("yaml-drawer");
  document.getElementById("btn-toggle-yaml").addEventListener("click", () => {
    drawer.classList.toggle("hidden");
    if (!drawer.classList.contains("hidden")) editor.focus();
  });
  document.getElementById("btn-close-yaml").addEventListener("click", () => {
    drawer.classList.add("hidden");
  });

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
      // Open URL in new tab when a leaf item is selected
      if (result.action && result.action.startsWith("select:") && result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err) {
      console.error("handleKey threw:", err);
    }
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
