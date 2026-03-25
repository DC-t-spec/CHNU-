import { getDocumentById } from '../../core/state.js';

export async function renderDocumentDetailPage({ params }) {
  const appRoot = document.querySelector('#app');
  const documentId = params.id;
  const document = getDocumentById(documentId);

  if (!document) {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Documento não encontrado</h2>
          <p>O documento solicitado não existe.</p>
          <a href="#documents" class="btn btn-primary">Voltar à lista</a>
        </div>
      </section>
    `;
    return;
  }

  appRoot.innerHTML = `
    <section class="page-shell document-detail-page">
      <div class="page-header">
        <div>
          <h1>Documento ${document.number}</h1>
          <p>Detalhe completo do documento</p>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Voltar</a>
          ${
            document.status === 'draft'
              ? `<a href="#documents/edit?id=${document.id}" class="btn btn-primary">Editar</a>`
              : ''
          }
        </div>
      </div>

      <div class="card detail-grid">
        <div><strong>Número:</strong> ${document.number}</div>
        <div><strong>Data:</strong> ${document.date}</div>
        <div><strong>Tipo:</strong> ${document.type}</div>
        <div><strong>Origem:</strong> ${document.origin}</div>
        <div><strong>Destino:</strong> ${document.destination}</div>
        <div>
          <strong>Status:</strong>
          <span class="status-chip status-${document.status}">
            ${document.status}
          </span>
        </div>
      </div>

      <div class="card">
        <h2>Linhas do documento</h2>
        <p>Esta área será ligada ao módulo document-lines.js na próxima fase.</p>
      </div>
    </section>
  `;
}
