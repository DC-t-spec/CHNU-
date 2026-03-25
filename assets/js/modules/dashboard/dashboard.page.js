import { getDocuments } from '../../core/state.js';

export async function renderDashboardPage() {
  const appRoot = document.querySelector('#app');
  const documents = getDocuments();

  const totalDocuments = documents.length;
  const draftDocuments = documents.filter((doc) => doc.status === 'draft').length;
  const postedDocuments = documents.filter((doc) => doc.status === 'posted').length;
  const cancelledDocuments = documents.filter((doc) => doc.status === 'cancelled').length;

  appRoot.innerHTML = `
    <section class="page-shell dashboard-page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral operacional do sistema CHNU</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card__label">Total de documentos</span>
          <strong class="stat-card__value">${totalDocuments}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-card__label">Em draft</span>
          <strong class="stat-card__value">${draftDocuments}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-card__label">Postados</span>
          <strong class="stat-card__value">${postedDocuments}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-card__label">Cancelados</span>
          <strong class="stat-card__value">${cancelledDocuments}</strong>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <h2>Resumo do sistema</h2>
          <p>
            O CHNU já está estruturado como sistema modular real, com navegação por rotas,
            renderização dinâmica e base sólida para workflow operacional de documentos.
          </p>
        </div>

        <div class="card">
          <h2>Próximos blocos</h2>
          <p>
            O próximo desenvolvimento entra na gestão das linhas do documento, totais,
            posting, cancelamento e bloqueios operacionais por status.
          </p>
        </div>
      </div>
    </section>
  `;
}
