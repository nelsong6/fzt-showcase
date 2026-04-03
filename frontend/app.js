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

let selectedIndex = 0;
let currentResults = [];
let scopeStack = [{ parentIdx: -1, query: "" }];

async function init() {
  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(
    fetch("fzh.wasm"),
    go.importObject
  );
  go.run(result.instance);

  document.getElementById("loading").classList.add("hidden");

  const editor = document.getElementById("yaml-editor");
  const input = document.getElementById("finder-input");

  editor.value = SAMPLE_YAML;
  applyYAML();

  document.getElementById("btn-sample").addEventListener("click", () => {
    editor.value = SAMPLE_YAML;
    resetScope();
    applyYAML();
    input.focus();
  });

  document.getElementById("btn-apply").addEventListener("click", () => {
    resetScope();
    applyYAML();
    input.focus();
  });

  input.addEventListener("input", () => {
    selectedIndex = 0;
    filterAndRender();
  });

  input.addEventListener("keydown", handleKeydown);
  input.focus();
}

function applyYAML() {
  const yaml = document.getElementById("yaml-editor").value;
  const result = fzh.loadYAML(yaml);
  if (result instanceof Error) {
    showError(result.message);
    return;
  }
  document.getElementById("finder-input").value = "";
  selectedIndex = 0;
  filterAndRender();
}

function resetScope() {
  scopeStack = [{ parentIdx: -1, query: "" }];
}

function currentScope() {
  return scopeStack[scopeStack.length - 1];
}

function filterAndRender() {
  const query = document.getElementById("finder-input").value;
  const scope = currentScope();

  const result = fzh.filter(query, { parentIdx: scope.parentIdx, depthPenalty: 5 });
  if (result instanceof Error) {
    showError(result.message);
    return;
  }

  currentResults = result || [];
  if (selectedIndex >= currentResults.length) {
    selectedIndex = Math.max(0, currentResults.length - 1);
  }

  renderResults();
  updateScopePath();
  updateItemCount();
}

function renderResults() {
  const container = document.getElementById("finder-results");
  container.innerHTML = "";

  for (let i = 0; i < currentResults.length; i++) {
    const item = currentResults[i];
    const row = document.createElement("div");
    row.className = "result-row" + (i === selectedIndex ? " selected" : "");
    row.dataset.index = i;

    const nameSpan = document.createElement("span");
    nameSpan.className = "result-name" + (item.hasChildren ? " result-folder" : "");
    nameSpan.innerHTML = highlightMatches(item.name, item.matchIndices ? item.matchIndices[0] : null);

    row.appendChild(nameSpan);

    if (item.description) {
      const descSpan = document.createElement("span");
      descSpan.className = "result-desc";
      descSpan.innerHTML = highlightMatches(item.description, item.matchIndices ? item.matchIndices[1] : null);
      row.appendChild(descSpan);
    }

    row.addEventListener("click", () => {
      selectedIndex = i;
      renderResults();
      drillDown();
    });

    container.appendChild(row);
  }

  scrollSelectedIntoView();
}

function highlightMatches(text, indices) {
  if (!indices || indices.length === 0) {
    return escapeHTML(text);
  }

  const indexSet = new Set(indices);
  let result = "";
  let inMatch = false;

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);
    if (isMatch && !inMatch) {
      result += '<span class="match">';
      inMatch = true;
    } else if (!isMatch && inMatch) {
      result += "</span>";
      inMatch = false;
    }
    result += escapeHTML(text[i]);
  }

  if (inMatch) result += "</span>";
  return result;
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (selectedIndex < currentResults.length - 1) {
        selectedIndex++;
        renderResults();
      }
      break;

    case "ArrowUp":
      e.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
        renderResults();
      }
      break;

    case "Enter":
      e.preventDefault();
      drillDown();
      break;

    case "Escape":
      e.preventDefault();
      if (document.getElementById("finder-input").value) {
        document.getElementById("finder-input").value = "";
        selectedIndex = 0;
        filterAndRender();
      } else if (scopeStack.length > 1) {
        const prev = scopeStack.pop();
        document.getElementById("finder-input").value = "";
        selectedIndex = 0;
        filterAndRender();
      }
      break;

    case "Tab":
      e.preventDefault();
      drillDown();
      break;
  }
}

function drillDown() {
  if (currentResults.length === 0) return;

  const item = currentResults[selectedIndex];
  if (item.hasChildren) {
    scopeStack.push({ parentIdx: item.index, query: "" });
    document.getElementById("finder-input").value = "";
    selectedIndex = 0;
    filterAndRender();
  }
}

function updateScopePath() {
  const el = document.getElementById("scope-path");
  if (scopeStack.length <= 1) {
    el.textContent = "";
    return;
  }

  const parts = scopeStack.slice(1).map((s) => {
    const items = fzh.getChildren(
      scopeStack[scopeStack.indexOf(s) - 1]
        ? scopeStack[scopeStack.indexOf(s) - 1].parentIdx
        : -1
    );
    // Just use the result from the current scope's parent info
    return "";
  });

  // Build path from scope stack by looking up item names
  const pathParts = [];
  for (let i = 1; i < scopeStack.length; i++) {
    const parentIdx = scopeStack[i].parentIdx;
    const allItems = fzh.filter("", { parentIdx: scopeStack[i - 1].parentIdx });
    const parent = allItems.find((item) => item.index === parentIdx);
    if (parent) pathParts.push(parent.name);
  }
  el.textContent = pathParts.join(" \u203A ");
}

function updateItemCount() {
  const el = document.getElementById("item-count");
  el.textContent = currentResults.length + " item" + (currentResults.length !== 1 ? "s" : "");
}

function scrollSelectedIntoView() {
  const container = document.getElementById("finder-results");
  const selected = container.querySelector(".selected");
  if (selected) {
    selected.scrollIntoView({ block: "nearest" });
  }
}

function showError(msg) {
  const container = document.getElementById("finder-results");
  container.innerHTML = '<div style="padding: 12px; color: var(--red);">Error: ' + escapeHTML(msg) + "</div>";
  currentResults = [];
}

init();
