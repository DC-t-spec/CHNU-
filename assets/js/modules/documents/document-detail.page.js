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
        <div><strong>Número</strong>${document.number}</div>
        <div><strong>Data</strong>${formatDocumentDate(document.date)}</div>
        <div><strong>Tipo</strong>${document.type}</div>
        <div><strong>Origem</strong>${document.origin}</div>
        <div><strong>Destino</strong>${document.destination}</div>
        <div>
          <strong>Status</strong>
          <span class="status-chip status-${document.status}">
            ${document.status}
          </span>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Linhas</h2>
            <p>Resumo dos itens associados ao documento</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Preço unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                document.lines.length
                  ? document.lines.map((line) => `
                    <tr>
                      <td>${line.item}</td>
                      <td>${formatNumber(line.quantity)}</td>
                      <td>${formatCurrency(line.unitPrice)}</td>
                      <td>${formatCurrency(line.total)}</td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td colspan="4" class="empty-state-cell">
                        Nenhuma linha adicionada.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>

        <div class="document-totals">
          <div class="document-totals__item">
            <span class="document-totals__label">Total de linhas</span>
            <strong class="document-totals__value">${document.totals.linesCount}</strong>
          </div>

          <div class="document-totals__item document-totals__item--highlight">
            <span class="document-totals__label">Total geral</span>
            <strong class="document-totals__value">${formatCurrency(document.totals.grandTotal)}</strong>
          </div>
        </div>
      </div>
    </section>
  `;
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDocumentDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}
