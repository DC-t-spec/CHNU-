document.addEventListener("DOMContentLoaded", () => {
  console.log("CHNU iniciado");

  const app = document.getElementById("app");

  function loadApp() {
    const currentPage = Router.getCurrentPage();
    console.log("Página atual:", currentPage);
    renderPage(app, currentPage);
  }

  function refreshCurrentPage() {
    const currentPage = Router.getCurrentPage();
    renderPage(app, currentPage);
  }

  loadApp();

  app.addEventListener("click", (event) => {
    handleAppClick(event, refreshCurrentPage);
  });

  app.addEventListener("input", (event) => {
    handleAppInput(event, refreshCurrentPage);
  });

  app.addEventListener("change", (event) => {
    handleAppChange(event, refreshCurrentPage);
  });

  window.addEventListener("hashchange", loadApp);
});

/* =========================================================
   STATE
   ========================================================= */

const documentsState = {
  filters: {
    search: "",
    status: "all"
  },

  items: [
    {
      id: "doc-1",
      number: "DOC-2026-0001",
      date: "18/03/2026 10:20",
      type: "Ajuste de Entrada",
      origin: "Armazém Central",
      destination: "Loja 1",
      status: "draft"
    },
    {
      id: "doc-2",
      number: "DOC-2026-0002",
      date: "18/03/2026 11:05",
      type: "Transferência",
      origin: "Armazém Central",
      destination: "Filial Matola",
      status: "posted"
    },
    {
      id: "doc-3",
      number: "DOC-2026-0003",
      date: "18/03/2026 12:10",
      type: "Ajuste de Saída",
      origin: "Loja 1",
      destination: "-",
      status: "cancelled"
    },
    {
      id: "doc-4",
      number: "DOC-2026-0004",
      date: "18/03/2026 13:00",
      type: "Produção",
      origin: "Fábrica",
      destination: "Armazém Central",
      status: "draft"
    },
    {
      id: "doc-5",
      number: "DOC-2026-0005",
      date: "18/03/2026 14:30",
      type: "Transferência",
      origin: "Filial Matola",
      destination: "Loja 1",
      status: "posted"
    }
  ]
};

/* =========================================================
   APP RENDER
   ========================================================= */

function renderPage(app, page) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <h2>CHNU</h2>
        <nav>
          <ul>
            <li><a href="#dashboard" class="${page === "dashboard" ? "active" : ""}">Dashboard</a></li>
            <li><a href="#documents" class="${page === "documents" ? "active" : ""}">Documents</a></li>
            <li><a href="#inventory" class="${page === "inventory" ? "active" : ""}">Inventory</a></li>
          </ul>
        </nav>
      </aside>

      <div class="app-main">
        <header class="topbar">
          <h1>${page.toUpperCase()}</h1>
        </header>

        <main class="page-content">
          ${renderContent(page)}
        </main>
      </div>
    </div>
  `;
}

function renderContent(page) {
  switch (page) {
    case "dashboard":
      return `
        <section class="page">
          <div class="page-header">
            <div class="page-header__content">
              <h1 class="page-title">Dashboard</h1>
              <p class="page-subtitle">Visão geral do sistema CHNU.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <p>Bem-vinda ao CHNU 🚀</p>
            </div>
          </div>
        </section>
      `;

    case "documents":
      return renderDocumentsPage();

    case "inventory":
      return `
        <section class="page">
          <div class="page-header">
            <div class="page-header__content">
              <h1 class="page-title">Inventory</h1>
              <p class="page-subtitle">Controlo de stock e movimentos.</p>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <p>Controlo de stock</p>
            </div>
          </div>
        </section>
      `;

    default:
      return `<p>CHNU</p>`;
  }
}

/* =========================================================
   GLOBAL EVENTS
   ========================================================= */

function handleAppClick(event, refreshCurrentPage) {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const documentId = actionButton.dataset.id || "";

  if (action === "clear-document-filters") {
    documentsState.filters.search = "";
    documentsState.filters.status = "all";
    refreshCurrentPage();
    return;
  }

  if (action === "new-document") {
    handleNewDocument(refreshCurrentPage);
    return;
  }

  if (action === "import-documents") {
    alert("Importação será ligada numa fase seguinte.");
    return;
  }

  if (!documentId) return;

  if (action === "view-document") {
    handleViewDocument(documentId);
    return;
  }

  if (action === "edit-document") {
    handleEditDocument(documentId, refreshCurrentPage);
    return;
  }

  if (action === "post-document") {
    handlePostDocument(documentId, refreshCurrentPage);
    return;
  }

  if (action === "cancel-document") {
    handleCancelDocument(documentId, refreshCurrentPage);
  }
}

function handleAppInput(event, refreshCurrentPage) {
  const target = event.target;

  if (target.matches("[data-filter='documents-search']")) {
    documentsState.filters.search = target.value;
    refreshCurrentPage();
  }
}

function handleAppChange(event, refreshCurrentPage) {
  const target = event.target;

  if (target.matches("[data-filter='documents-status']")) {
    documentsState.filters.status = target.value;
    refreshCurrentPage();
  }
}

/* =========================================================
   DOCUMENTS — HELPERS
   ========================================================= */

function getDocumentById(documentId) {
  return documentsState.items.find((doc) => doc.id === documentId);
}

function getFilteredDocuments() {
  const search = documentsState.filters.search.trim().toLowerCase();
  const status = documentsState.filters.status;

  return documentsState.items.filter((doc) => {
    const matchesStatus = status === "all" ? true : doc.status === status;

    const haystack = [
      doc.number,
      doc.type,
      doc.origin,
      doc.destination,
      doc.status,
      doc.date
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = search ? haystack.includes(search) : true;

    return matchesStatus && matchesSearch;
  });
}

function getDocumentsStats(documents) {
  return {
    draft: documents.filter((doc) => doc.status === "draft").length,
    posted: documents.filter((doc) => doc.status === "posted").length,
    cancelled: documents.filter((doc) => doc.status === "cancelled").length,
    total: documents.length
  };
}

function generateNextDocumentNumber() {
  const prefix = "DOC-2026-";
  const numbers = documentsState.items
    .map((doc) => {
      const parts = doc.number.split(prefix);
      return parts[1] ? Number(parts[1]) : 0;
    })
    .filter((n) => !Number.isNaN(n));

  const maxNumber = numbers.length ? Math.max(...numbers) : 0;
  const nextNumber = String(maxNumber + 1).padStart(4, "0");

  return `${prefix}${nextNumber}`;
}

function getCurrentDateTimeString() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/* =========================================================
   DOCUMENTS — ACTIONS
   ========================================================= */

function handleNewDocument(refreshCurrentPage) {
  const type = prompt("Tipo do novo documento:", "Transferência");
  if (type === null) return;

  const cleanedType = type.trim();
  if (!cleanedType) {
    alert("O tipo do documento é obrigatório.");
    return;
  }

  const origin = prompt("Origem:", "Armazém Central");
  if (origin === null) return;

  const cleanedOrigin = origin.trim();
  if (!cleanedOrigin) {
    alert("A origem é obrigatória.");
    return;
  }

  const destination = prompt("Destino:", "Loja 1");
  if (destination === null) return;

  const cleanedDestination = destination.trim();
  if (!cleanedDestination) {
    alert("O destino é obrigatório.");
    return;
  }

  documentsState.items.unshift({
    id: `doc-${Date.now()}`,
    number: generateNextDocumentNumber(),
    date: getCurrentDateTimeString(),
    type: cleanedType,
    origin: cleanedOrigin,
    destination: cleanedDestination,
    status: "draft"
  });

  refreshCurrentPage();
}

function handleViewDocument(documentId) {
  const documentItem = getDocumentById(documentId);

  if (!documentItem) {
    alert("Documento não encontrado.");
    return;
  }

  alert(
    [
      `Número: ${documentItem.number}`,
      `Data: ${documentItem.date}`,
      `Tipo: ${documentItem.type}`,
      `Origem: ${documentItem.origin}`,
      `Destino: ${documentItem.destination}`,
      `Status: ${documentItem.status}`
    ].join("\n")
  );
}

function handleEditDocument(documentId, refreshCurrentPage) {
  const documentItem = getDocumentById(documentId);

  if (!documentItem) {
    alert("Documento não encontrado.");
    return;
  }

  if (documentItem.status !== "draft") {
    alert("Só documentos draft podem ser editados.");
    return;
  }

  const newType = prompt("Editar tipo do documento:", documentItem.type);
  if (newType === null) return;

  const cleanedType = newType.trim();
  if (!cleanedType) {
    alert("O tipo do documento não pode ficar vazio.");
    return;
  }

  documentItem.type = cleanedType;
  refreshCurrentPage();
}

function handlePostDocument(documentId, refreshCurrentPage) {
  const documentItem = getDocumentById(documentId);

  if (!documentItem) {
    alert("Documento não encontrado.");
    return;
  }

  if (documentItem.status !== "draft") {
    alert("Só documentos draft podem ser posted.");
    return;
  }

  const confirmed = confirm(
    `Confirmas o post do documento ${documentItem.number}?`
  );

  if (!confirmed) return;

  documentItem.status = "posted";
  refreshCurrentPage();
}

function handleCancelDocument(documentId, refreshCurrentPage) {
  const documentItem = getDocumentById(documentId);

  if (!documentItem) {
    alert("Documento não encontrado.");
    return;
  }

  if (documentItem.status !== "posted") {
    alert("Só documentos posted podem ser cancelados.");
    return;
  }

  const confirmed = confirm(
    `Tens a certeza que queres cancelar o documento ${documentItem.number}?`
  );

  if (!confirmed) return;

  documentItem.status = "cancelled";
  refreshCurrentPage();
}

/* =========================================================
   DOCUMENTS — RENDER
   ========================================================= */

function renderDocumentsPage() {
  const filteredDocuments = getFilteredDocuments();

  return `
    <section class="page documents-page">
      ${renderDocumentsHeader()}
      ${renderDocumentsToolbar()}
      ${renderDocumentsStats(filteredDocuments)}
      ${renderDocumentsTable(filteredDocuments)}
    </section>
  `;
}

function renderDocumentsHeader() {
  return `
    <div class="page-header">
      <div class="page-header__content">
        <h1 class="page-title">Documents</h1>
        <p class="page-subtitle">Gestão completa de documentos do sistema.</p>
      </div>

      <div class="button-group">
        <button class="btn btn--secondary" data-action="import-documents">
          Importar
        </button>
        <button class="btn btn--primary" data-action="new-document">
          Novo Documento
        </button>
      </div>
    </div>
  `;
}

function renderDocumentsToolbar() {
  return `
    <div class="card">
      <div class="toolbar">
        <div class="toolbar__left" style="flex: 1;">
          <div class="field" style="min-width: 260px; flex: 1;">
            <label class="field-label" for="documents-search">Pesquisar</label>
            <input
              id="documents-search"
              class="input"
              type="text"
              placeholder="Número, tipo, origem, destino..."
              value="${escapeHtml(documentsState.filters.search)}"
              data-filter="documents-search"
            />
          </div>

          <div class="field" style="min-width: 200px;">
            <label class="field-label" for="documents-status">Status</label>
            <select
              id="documents-status"
              class="select"
              data-filter="documents-status"
            >
              <option value="all" ${documentsState.filters.status === "all" ? "selected" : ""}>Todos</option>
              <option value="draft" ${documentsState.filters.status === "draft" ? "selected" : ""}>Draft</option>
              <option value="posted" ${documentsState.filters.status === "posted" ? "selected" : ""}>Posted</option>
              <option value="cancelled" ${documentsState.filters.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="toolbar__right">
          <button class="btn btn--ghost" data-action="clear-document-filters">
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDocumentsStats(documents) {
  const stats = getDocumentsStats(documents);

  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Draft</span>
        <strong class="stat-value">${stats.draft}</strong>
        <span class="stat-meta">Documentos em edição</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Posted</span>
        <strong class="stat-value">${stats.posted}</strong>
        <span class="stat-meta">Já impactaram stock</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Cancelled</span>
        <strong class="stat-value">${stats.cancelled}</strong>
        <span class="stat-meta">Revertidos</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Total</span>
        <strong class="stat-value">${stats.total}</strong>
        <span class="stat-meta">Registos visíveis</span>
      </div>
    </div>
  `;
}

function renderDocumentsTable(documents) {
  const rows = documents.map((doc) => renderDocumentRow(doc)).join("");

  return `
    <div class="card table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Status</th>
              <th>Acções</th>
            </tr>
          </thead>
          <tbody>
            ${rows || renderDocumentsEmptyRow()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDocumentsEmptyRow() {
  return `
    <tr>
      <td colspan="6">
        <div class="empty-state">
          <div class="empty-state__title">Sem documentos</div>
          <div class="empty-state__text">
            Nenhum documento corresponde aos filtros aplicados.
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderDocumentRow(doc) {
  return `
    <tr data-document-id="${doc.id}">
      <td>
        <div class="cell-title">${escapeHtml(doc.number)}</div>
        <div class="cell-subtitle">${escapeHtml(doc.date)}</div>
      </td>
      <td>${escapeHtml(doc.type)}</td>
      <td>${escapeHtml(doc.origin)}</td>
      <td>${escapeHtml(doc.destination)}</td>
      <td>${renderStatusBadge(doc.status)}</td>
      <td>
        <div class="cell-actions">
          <button
            class="btn btn--sm btn--ghost"
            data-action="view-document"
            data-id="${doc.id}"
          >
            Ver
          </button>

          ${
            doc.status === "draft"
              ? `
                <button
                  class="btn btn--sm btn--secondary"
                  data-action="edit-document"
                  data-id="${doc.id}"
                >
                  Editar
                </button>

                <button
                  class="btn btn--sm btn--primary"
                  data-action="post-document"
                  data-id="${doc.id}"
                >
                  Postar
                </button>
              `
              : ""
          }

          ${
            doc.status === "posted"
              ? `
                <button
                  class="btn btn--sm btn--danger"
                  data-action="cancel-document"
                  data-id="${doc.id}"
                >
                  Cancelar
                </button>
              `
              : ""
          }
        </div>
      </td>
    </tr>
  `;
}

function renderStatusBadge(status) {
  if (status === "draft") {
    return `<span class="badge badge--draft">Draft</span>`;
  }

  if (status === "posted") {
    return `<span class="badge badge--posted">Posted</span>`;
  }

  if (status === "cancelled") {
    return `<span class="badge badge--cancelled">Cancelled</span>`;
  }

  return `<span class="badge badge--neutral">${escapeHtml(status)}</span>`;
}

/* =========================================================
   UTILS
   ========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
