import { getDocuments } from '../../core/state.js';

export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');
  const documents = getDocuments();

  appRoot.innerHTML = `
    <section class="page-shell documents-page">
      <div class="page-header">
        <div>
          <h1>Documentos</h1>
          <p>Gestão de documentos operacionais do sistema</p>
        </div>

        <div class="page-actions">
          <a href="#documents/new" class="btn btn-primary">Novo documento</a>
        </div>
      </div>

      <div class="card toolbar-card">
        <div class="toolbar">
          <div class="toolbar__group">
            <span class="toolbar__label">Módulo</span>
            <strong class="toolbar__value">Documents</strong>
          </div>

          <div class="toolbar__group">
            <span class="toolbar__label">Total</span>
            <strong class="toolbar__value">${documents.length}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${
                documents.length
                  ? documents.map((doc) => `
                    <tr>
                      <td>${doc.number}</td>
                      <td>${formatDocumentDate(doc.date)}</td>
                      <td>${doc.type}</td>
                      <td>${doc.origin}</td>
                      <td>${doc.destination}</td>
                      <td>
                        <span class="status-chip status-${doc.status}">
                          ${doc.status}
                        </span>
                      </td>
                      <td>
                        <div class="table-actions">
                          <a href="#documents/view?id=${doc.id}" class="btn btn-sm btn-secondary">Ver</a>
                          ${
                            doc.status === 'draft'
                              ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-sm btn-primary">Editar</a>`
                              : ''
                          }
                        </div>
                      </td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td colspan="7" class="empty-state-cell">
                        Nenhum documento encontrado.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function formatDocumentDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}
