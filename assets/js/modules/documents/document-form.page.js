import {
  getDocument,
  getDocumentFormOptions,
  createNewDocument,
  updateExistingDocument,
} from '../../services/documents.service.js';

import { showToast } from '../../ui/toast.js';

export async function renderDocumentFormPage(context = {}) {
  const app = document.querySelector('#app');
  const params = context?.params || context || {};
  const isEdit = !!params.id;
  const documentData = isEdit ? getDocument(params.id) : null;
  const options = getDocumentFormOptions();

  if (isEdit && !documentData) {
    app.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Documento não encontrado</h2>
          <p>O documento solicitado não existe.</p>
          <a href="#documents" class="btn btn-primary">Voltar</a>
        </div>
      </section>
    `;
    return;
  }

  const initialType = documentData?.type || 'Transferência';
  const initialDate = documentData?.date || getTodayDate();
  const initialOrigin = documentData?.origin || '';
  const initialDestination = documentData?.destination || '';
  let lines = Array.isArray(documentData?.lines)
    ? documentData.lines.map((line) => ({
        id: line.id || crypto.randomUUID(),
        product_id: line.product_id || '',
        item: line.item || '',
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      }))
    : [createEmptyLine()];

  app.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header">
        <div>
          <h1>${isEdit ? 'Editar documento' : 'Novo documento'}</h1>
          <p>Documento operacional com integração a stock.</p>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Voltar</a>
        </div>
      </div>

      <div class="card">
        <form id="document-form" class="document-form-grid">
          <div class="form-group">
            <label for="document-type">Tipo</label>
            <select id="document-type" name="type" class="toolbar__select">
              ${options.documentTypes
                .map(
                  (type) => `
                    <option value="${escapeHtml(type)}" ${type === initialType ? 'selected' : ''}>
                      ${type}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="document-date">Data</label>
            <input
              id="document-date"
              name="date"
              type="date"
              class="toolbar__input"
              value="${escapeHtml(initialDate)}"
            />
          </div>

          <div class="form-group">
            <label for="document-origin">Origem</label>
            <select id="document-origin" name="origin" class="toolbar__select">
              <option value="">Selecionar</option>
              ${options.warehouses
                .map(
                  (warehouse) => `
                    <option value="${escapeHtml(warehouse.name)}" ${warehouse.name === initialOrigin ? 'selected' : ''}>
                      ${warehouse.name}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="document-destination">Destino</label>
            <select id="document-destination" name="destination" class="toolbar__select">
              <option value="">Selecionar</option>
              ${options.warehouses
                .map(
                  (warehouse) => `
                    <option value="${escapeHtml(warehouse.name)}" ${warehouse.name === initialDestination ? 'selected' : ''}>
                      ${warehouse.name}
                    </option>
                  `
                )
                .join('')}
            </select>
          </div>

          <div class="form-group form-group--full">
            <div class="document-form__section-header">
              <h3>Linhas do documento</h3>
              <button type="button" id="add-document-line" class="btn btn-primary">Adicionar linha</button>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 38%;">Produto</th>
                    <th style="width: 16%;">Quantidade</th>
                    <th style="width: 16%;">Preço unit.</th>
                    <th style="width: 16%;">Total</th>
                    <th style="width: 14%;">Ações</th>
                  </tr>
                </thead>
                <tbody id="document-lines-body"></tbody>
              </table>
            </div>
          </div>

          <div class="form-group form-group--full">
            <div class="document-totals-card">
              <div class="document-total-item">
                <span>Linhas</span>
                <strong id="document-lines-count">0</strong>
              </div>
              <div class="document-total-item">
                <span>Total geral</span>
                <strong id="document-grand-total">0,00</strong>
              </div>
            </div>
          </div>

          <div class="form-group form-group--full">
            <div class="page-actions">
              <button type="submit" class="btn btn-primary">
                ${isEdit ? 'Guardar alterações' : 'Criar documento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  `;

  const form = document.querySelector('#document-form');
  const typeSelect = document.querySelector('#document-type');
  const originSelect = document.querySelector('#document-origin');
  const destinationSelect = document.querySelector('#document-destination');
  const addLineButton = document.querySelector('#add-document-line');
  const linesBody = document.querySelector('#document-lines-body');
  const linesCountEl = document.querySelector('#document-lines-count');
  const grandTotalEl = document.querySelector('#document-grand-total');

  function syncWarehouseRules() {
    const type = typeSelect.value;

    if (type === 'Ajuste') {
      originSelect.value = '';
      originSelect.disabled = true;
    } else {
      originSelect.disabled = false;
    }
  }

  function createLineRow(line, index) {
    const total = Number(line.quantity || 0) * Number(line.unitPrice || 0);

    return `
      <tr data-line-index="${index}">
        <td>
          <select class="toolbar__select" data-line-field="product_id" data-line-index="${index}">
            <option value="">Selecionar produto</option>
            ${options.products
              .map(
                (product) => `
                  <option value="${escapeHtml(product.id)}" ${product.id === line.product_id ? 'selected' : ''}>
                    ${escapeHtml(product.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </td>
        <td>
          <input
            type="number"
            min="0"
            step="0.01"
            class="toolbar__input"
            data-line-field="quantity"
            data-line-index="${index}"
            value="${line.quantity}"
          />
        </td>
        <td>
          <input
            type="number"
            min="0"
            step="0.01"
            class="toolbar__input"
            data-line-field="unitPrice"
            data-line-index="${index}"
            value="${line.unitPrice}"
          />
        </td>
        <td>
          <strong>${formatCurrency(total)}</strong>
        </td>
        <td>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            data-remove-line="${index}"
          >
            Remover
          </button>
        </td>
      </tr>
    `;
  }

  function renderLines() {
    if (!lines.length) {
      lines = [createEmptyLine()];
    }

    linesBody.innerHTML = lines.map(createLineRow).join('');

    const grandTotal = lines.reduce((sum, line) => {
      return sum + Number(line.quantity || 0) * Number(line.unitPrice || 0);
    }, 0);

    linesCountEl.textContent = String(lines.length);
    grandTotalEl.textContent = formatCurrency(grandTotal);
  }

  function getProductById(productId) {
    return options.products.find((product) => product.id === productId) || null;
  }

  addLineButton.addEventListener('click', () => {
    lines.push(createEmptyLine());
    renderLines();
  });

  linesBody.addEventListener('input', (event) => {
    const field = event.target.dataset.lineField;
    const index = Number(event.target.dataset.lineIndex);

    if (!field || Number.isNaN(index) || !lines[index]) return;

    if (field === 'quantity' || field === 'unitPrice') {
      lines[index][field] = Number(event.target.value || 0);
    }

    renderLines();
  });

  linesBody.addEventListener('change', (event) => {
    const field = event.target.dataset.lineField;
    const index = Number(event.target.dataset.lineIndex);

    if (!field || Number.isNaN(index) || !lines[index]) return;

    if (field === 'product_id') {
      const productId = event.target.value;
      const product = getProductById(productId);

      lines[index].product_id = productId;
      lines[index].item = product?.name || '';
    }

    renderLines();
  });

  linesBody.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-remove-line]');
    if (!trigger) return;

    const index = Number(trigger.dataset.removeLine);
    if (Number.isNaN(index)) return;

    lines.splice(index, 1);
    renderLines();
  });

  typeSelect.addEventListener('change', syncWarehouseRules);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const type = typeSelect.value;
    const date = document.querySelector('#document-date').value;
    const origin = originSelect.value;
    const destination = destinationSelect.value;

    const payload = {
      type,
      date,
      origin: type === 'Ajuste' ? '' : origin,
      destination,
      lines: lines
        .filter((line) => line.product_id && Number(line.quantity || 0) > 0)
        .map((line) => ({
          product_id: line.product_id,
          item: line.item,
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.unitPrice || 0),
        })),
    };

    if (!payload.date) {
      showToast('Preencha a data.');
      return;
    }

    if (payload.type === 'Transferência') {
      if (!payload.origin) {
        showToast('Selecione o armazém de origem.');
        return;
      }

      if (!payload.destination) {
        showToast('Selecione o armazém de destino.');
        return;
      }

      if (payload.origin === payload.destination) {
        showToast('Origem e destino devem ser diferentes.');
        return;
      }
    }

    if (payload.type === 'Ajuste' && !payload.destination) {
      showToast('Selecione o armazém de destino.');
      return;
    }

    if (!payload.lines.length) {
      showToast('Adicione pelo menos uma linha válida.');
      return;
    }

    try {
      const saved = isEdit
        ? updateExistingDocument(documentData.id, payload)
        : createNewDocument(payload);

      showToast(isEdit ? 'Documento actualizado com sucesso.' : 'Documento criado com sucesso.');
      window.location.hash = `#documents/view?id=${saved.id}`;
    } catch (error) {
      showToast(error?.message || 'Erro ao guardar documento.');
    }
  });

  syncWarehouseRules();
  renderLines();
}

function createEmptyLine() {
  return {
    id: crypto.randomUUID(),
    product_id: '',
    item: '',
    quantity: 1,
    unitPrice: 0,
  };
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
