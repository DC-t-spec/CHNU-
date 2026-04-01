import {
  addDocumentLine,
  getDocumentById,
  getProducts,
  removeDocumentLine,
  updateDocumentLine,
} from '../../core/state.js';

function renderProductOptions(selectedValue = '') {
  const products = getProducts() || [];

  return `
    <option value="">Selecionar produto</option>
    ${products
      .map((product) => {
        const selected = product.name === selectedValue ? 'selected' : '';
        return `
          <option value="${product.name}" ${selected}>
            ${product.name} (${product.sku || 'Sem SKU'})
          </option>
        `;
      })
      .join('')}
  `;
}

export function renderDocumentLinesSection(document) {
  const isEditable = document.status === 'draft';

  return `
    <div class="card">
      <div class="section-header">
        <div>
          <h2>Linhas do documento</h2>
          <p>Itens operacionais associados ao documento</p>
        </div>
      </div>

      ${
        isEditable
          ? renderLineForm(document.id)
          : ''
      }

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

  const lineActions = document.querySelector('#document-lines-table');
  if (lineActions) {
    lineActions.addEventListener('click', (event) => {
      handleLineTableClick(event, documentId);
    });
  }
}

function renderLineForm(documentId) {
  return `
    <form id="document-line-form" class="line-form" data-document-id="${documentId}">
      <div class="line-form__grid">
        <div class="form-field">
          <label for="line-item">Item</label>
          <select id="line-item" name="item" required>
            ${renderProductOptions()}
          </select>
        </div>

        <div class="form-field">
          <label for="line-quantity">Quantidade</label>
          <input id="line-quantity" name="quantity" type="number" min="0.01" step="0.01" placeholder="0" required />
        </div>

        <div class="form-field">
          <label for="line-unit-price">Preço unitário</label>
          <input id="line-unit-price" name="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" required />
        </div>

        <div class="line-form__actions">
          <button type="submit" class="btn btn-primary">Adicionar linha</button>
        </div>
      </div>
    </form>
  `;
}

function renderLinesTable(documentData) {
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
            documentData.lines.length
              ? documentData.lines.map((line) => `
                <tr>
                  <td>${line.item}</td>
                  <td>${formatNumber(line.quantity)}</td>
                  <td>${formatCurrency(line.unitPrice)}</td>
                  <td>${formatCurrency(line.total)}</td>
                  <td>
                    ${
                      documentData.status === 'draft'
                        ? `
                          <div class="table-actions">
                            <button
                              type="button"
                              class="btn btn-sm btn-secondary"
                              data-action="edit-line"
                              data-line-id="${line.id}"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-danger"
                              data-action="remove-line"
                              data-line-id="${line.id}"
                            >
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
  return `
    <div class="document-totals">
      <div class="document-totals__item">
        <span class="document-totals__label">Total de linhas</span>
        <strong class="document-totals__value">${documentData.totals.linesCount}</strong>
      </div>

      <div class="document-totals__item document-totals__item--highlight">
        <span class="document-totals__label">Total geral</span>
        <strong class="document-totals__value">${formatCurrency(documentData.totals.grandTotal)}</strong>
      </div>
    </div>
  `;
}

function handleAddLine(event, documentId) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const payload = {
    item: formData.get('item')?.trim(),
    quantity: Number(formData.get('quantity')),
    unitPrice: Number(formData.get('unitPrice')),
  };

  if (!payload.item) {
    alert('Seleciona um produto válido.');
    return;
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    alert('A quantidade deve ser maior que zero.');
    return;
  }

  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
    alert('O preço unitário é inválido.');
    return;
  }

  addDocumentLine(documentId, payload);
  window.location.hash = `#documents/edit?id=${documentId}`;
}

function handleLineTableClick(event, documentId) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const action = trigger.dataset.action;
  const lineId = trigger.dataset.lineId;
  if (!action || !lineId) return;

  if (action === 'remove-line') {
    removeDocumentLine(documentId, lineId);
    window.location.hash = `#documents/edit?id=${documentId}`;
    return;
  }

  if (action === 'edit-line') {
    openLineEditPrompt(documentId, lineId);
  }
}

function openLineEditPrompt(documentId, lineId) {
  const documentData = getDocumentById(documentId);
  if (!documentData) return;

  const line = documentData.lines.find((entry) => entry.id === lineId);
  if (!line) return;

  const products = getProducts() || [];
  const allowedProductNames = products.map((product) => product.name);

  const nextItem = window.prompt(
    `Editar item:\nProdutos válidos: ${allowedProductNames.join(', ')}`,
    line.item
  );
  if (nextItem === null) return;

  const normalizedItem = nextItem.trim();

  if (!allowedProductNames.includes(normalizedItem)) {
    alert('Produto inválido. Escolhe um produto existente no catálogo.');
    return;
  }

  const nextQuantity = window.prompt('Editar quantidade:', String(line.quantity));
  if (nextQuantity === null) return;

  const nextUnitPrice = window.prompt('Editar preço unitário:', String(line.unitPrice));
  if (nextUnitPrice === null) return;

  const quantity = Number(nextQuantity);
  const unitPrice = Number(nextUnitPrice);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert('Quantidade inválida.');
    return;
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    alert('Preço unitário inválido.');
    return;
  }

  updateDocumentLine(documentId, lineId, {
    item: normalizedItem,
    quantity,
    unitPrice,
  });

  window.location.hash = `#documents/edit?id=${documentId}`;
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
