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
      return "<p>Gestão de documentos</p>";

    case "inventory":
      return "<p>Controlo de stock</p>";

    default:
      return "<p>CHNU</p>";
  }
}
