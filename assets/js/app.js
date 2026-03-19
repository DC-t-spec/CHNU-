document.addEventListener("DOMContentLoaded", () => {
  console.log("CHNU iniciado");

  const app = document.getElementById("app");

  function loadApp() {
    const currentPage = Router.getCurrentPage();
    console.log("Página atual:", currentPage);
    renderPage(app, currentPage);
  }

  loadApp();

  window.addEventListener("hashchange", loadApp);
});

const documentsState = {
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
    }
  ]
};

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
      return "<p>Bem-vinda ao CHNU 🚀</p>";

case "documents":
  return renderDocumentsPage();

    case "inventory":
      return "<p>Controlo de stock</p>";

    default:
      return "<p>CHNU</p>";
  }
}

function renderDocumentsPage() {
  const documents = documentsState.items;

  return `
    <section class="page">
      ${renderDocumentsHeader()}
      ${renderDocumentsStats(documents)}
      ${renderDocumentsTable(documents)}
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
        <button class="btn btn--secondary">Importar</button>
        <button class="btn btn--primary">Novo Documento</button>
      </div>
    </div>
  `;
}

function renderDocumentsStats(documents) {
  const draftCount = documents.filter((doc) => doc.status === "draft").length;
  const postedCount = documents.filter((doc) => doc.status === "posted").length;
  const cancelledCount = documents.filter((doc) => doc.status === "cancelled").length;
  const totalCount = documents.length;

  return `
    <div class="stat-grid">
      <div class="card stat-card">
        <span class="stat-label">Draft</span>
        <strong class="stat-value">${draftCount}</strong>
        <span class="stat-meta">Documentos em edição</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Posted</span>
        <strong class="stat-value">${postedCount}</strong>
        <span class="stat-meta">Já impactaram stock</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Cancelled</span>
        <strong class="stat-value">${cancelledCount}</strong>
        <span class="stat-meta">Revertidos</span>
      </div>

      <div class="card stat-card">
        <span class="stat-label">Total</span>
        <strong class="stat-value">${totalCount}</strong>
        <span class="stat-meta">Registos totais</span>
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
            Ainda não existem documentos registados nesta secção.
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
        <div class="cell-title">${doc.number}</div>
        <div class="cell-subtitle">${doc.date}</div>
      </td>
      <td>${doc.type}</td>
      <td>${doc.origin}</td>
      <td>${doc.destination}</td>
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

  return `<span class="badge badge--neutral">${status}</span>`;
}
