import { getProducts } from '../../core/state.js';
import {
  addLineToDocument,
  updateLineInDocument,
  removeLineFromDocument,
  getDocumentDetails,
} from './documents.service.js';

function renderProductOptions(selectedValue = '') {
  const products = getProducts() || [];

  return `
    <option value="">Selecionar produto</option>
    ${products
      .map((product) => {
        const selected = product.id === selectedValue ? 'selected' : '';
        return `
          <option value="${product.id}" ${selected}>
            ${product.name} (${product.sku || 'Sem SKU'})
          </option>
        `;
      })
      .join('')}
  `;
}

export function renderDocumentLinesSection(document) {
  const isEditable = document.canEdit;

  return `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Linhas do documento</h2>
          <p>Itens operacionais associados ao documento</p>
        </div>
      </div>

      ${isEditable ? renderLineForm(document.id) : ''}

      ${renderLinesTable(document)}
      ${renderLinesTotals(document)}
    </div>
  `;
}

export function bindDocumentLinesEvents(documentId) {
  const addForm = document.querySelector('#document-line-form');

  if (addForm) {
    addForm.addEventListener('submit', (event) => {
      handleAddLine(event, documentId);
    });
  }

  const table = document.querySelector('#document-lines-table');

  if (table) {
    table.addEventListener('click', (event) => {
      handleLineTableClick(event, documentId);
    });
  }
}

function renderLineForm(documentId) {
  return `
    <form id="document-line-form" class="line-form">
      <div class="line-form__grid">
        <div class="form-field">
          <label>Item</label>
          <select name="product_id" required>
            ${renderProductOptions()}
          </select>
        </div>

        <div class="form-field">
          <label>Quantidade</label>
          <input name="quantity" type="number" min="0.01" step="0.01" required />
        </div>

        <div class="form-field">
          <label>Preço unitário</label>
          <input name="unitPrice" type="number" min="0" step="0.01" required />
        </div>

        <div class="line-form__actions">
          <button type="submit" class="btn btn-primary">
            Adicionar linha
          </button>
        </div>
      </div>
    </form>
  `;
}

function renderLinesTable(documentData) {
  const lines = documentData.lines || [];

  return `
    <div class="table-responsive">
      <table class="data-table" id="document-lines-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantidade</th>
            <th>Preço unitário</th>
            <th>Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${
            lines.length
              ? lines.map((line) => `
                <tr>
                  <td>${escapeHtml(line.item)}</td>
                  <td>${formatNumber(line.quantity)}</td>
                  <td>${formatCurrency(line.unitPrice)}</td>
                  <td>${formatCurrency(line.total)}</td>
                  <td>
                    ${
                      documentData.canEdit
                        ? `
                          <div class="table-actions">
                            <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${line.id}">
                              Editar
                            </button>
                            <button class="btn btn-sm btn-danger" data-action="remove" data-id="${line.id}">
                              Remover
                            </button>
                          </div>
                        `
                        : `<span class="table-muted-text">Sem ações</span>`
                    }
                  </td>
                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="5" class="empty-state-cell">
                    Nenhuma linha adicionada.
                  </td>
                </tr>
              `
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderLinesTotals(documentData) {
  const totals = documentData.totals || {
    linesCount: 0,
    grandTotal: 0,
  };

  return `
    <div class="document-totals">
      <div class="document-totals__item">
        <span>Total de linhas</span>
        <strong>${totals.linesCount}</strong>
      </div>

      <div class="document-totals__item document-totals__item--highlight">
        <span>Total geral</span>
        <strong>${formatCurrency(totals.grandTotal)}</strong>
      </div>
    </div>
  `;
}

function handleAddLine(event, documentId) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const products = getProducts() || [];

  const productId = formData.get('product_id');
  const product = products.find((p) => p.id === productId);

  const payload = {
    product_id: productId,
    item: product?.name || '',
    quantity: Number(formData.get('quantity')),
    unitPrice: Number(formData.get('unitPrice')),
  };

  try {
    addLineToDocument(documentId, payload);
    window.location.hash = `#documents/edit?id=${documentId}`;
  } catch (error) {
    alert(error.message);
  }
}

function handleLineTableClick(event, documentId) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const lineId = btn.dataset.id;

  if (action === 'remove') {
    removeLineFromDocument(documentId, lineId);
    window.location.hash = `#documents/edit?id=${documentId}`;
  }

  if (action === 'edit') {
    openEditPrompt(documentId, lineId);
  }
}

function openEditPrompt(documentId, lineId) {
  const doc = getDocumentDetails(documentId);
  const line = doc.lines.find((l) => l.id === lineId);
  if (!line) return;

  const quantity = Number(prompt('Quantidade:', line.quantity));
  const unitPrice = Number(prompt('Preço unitário:', line.unitPrice));

  try {
    updateLineInDocument(documentId, lineId, {
      quantity,
      unitPrice,
    });

    window.location.hash = `#documents/edit?id=${documentId}`;
  } catch (error) {
    alert(error.message);
  }
}

function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
  })} MT`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-PT');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
