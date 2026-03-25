export async function renderDashboardPage() {
  const appRoot = document.querySelector('#app');

  appRoot.innerHTML = `
    <section class="page-shell dashboard-page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do sistema CHNU</p>
        </div>
      </div>

      <div class="card">
        <h2>Bem-vinda ao CHNU</h2>
        <p>Sistema ERP/Admin modular em construção real.</p>
      </div>
    </section>
  `;
}
