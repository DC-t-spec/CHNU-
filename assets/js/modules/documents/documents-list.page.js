import { getDocuments } from '../../core/state.js';

export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');
  const documents = getDocuments();

  appRoot.innerHTML = `
    <section class="page-shell documents-page">
      <div class="page-header">
        <div>
          <h1>Documentos</h1>
          <p>Gestão de documentos operacionais</p>
        </div>

        <div class="page-actions">
          <a href="#documents/new" class="btn btn-primary">Novo documento</a>
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
                      <td>${doc.date}</td>
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
                          <a href="#documents/view?id=${doc.id}" class="btn btn-sm">Ver</a>
                          ${
                            doc.status === 'draft'
                              ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-sm btn-secondary">Editar</a>`
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
