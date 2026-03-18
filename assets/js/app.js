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
  return `
    <section class="page">
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

      <div class="stat-grid">
        <div class="card stat-card">
          <span class="stat-label">Draft</span>
          <strong class="stat-value">18</strong>
          <span class="stat-meta">Documentos em edição</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Posted</span>
          <strong class="stat-value">42</strong>
          <span class="stat-meta">Já impactaram stock</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Cancelled</span>
          <strong class="stat-value">3</strong>
          <span class="stat-meta">Revertidos</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Total</span>
          <strong class="stat-value">63</strong>
          <span class="stat-meta">Registos totais</span>
        </div>
      </div>

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
              <tr>
                <td>
                  <div class="cell-title">DOC-2026-0001</div>
                  <div class="cell-subtitle">18/03/2026 10:20</div>
                </td>
                <td>Ajuste de Entrada</td>
                <td>Armazém Central</td>
                <td>Loja 1</td>
                <td><span class="badge badge--draft">Draft</span></td>
                <td>
                  <div class="cell-actions">
                    <button class="btn btn--sm btn--ghost">Ver</button>
                    <button class="btn btn--sm btn--secondary">Editar</button>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div class="cell-title">DOC-2026-0002</div>
                  <div class="cell-subtitle">18/03/2026 11:05</div>
                </td>
                <td>Transferência</td>
                <td>Armazém Central</td>
                <td>Filial Matola</td>
                <td><span class="badge badge--posted">Posted</span></td>
                <td>
                  <div class="cell-actions">
                    <button class="btn btn--sm btn--ghost">Ver</button>
                    <button class="btn btn--sm btn--danger">Cancelar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

    case "inventory":
      return "<p>Controlo de stock</p>";

    default:
      return "<p>CHNU</p>";
  }
}
