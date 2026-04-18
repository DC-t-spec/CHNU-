// assets/js/modules/documents/document-form.page.js

import {
  getDocumentService,
  saveDocumentService,
  getProductsService,
  getWarehousesService,
} from '../../services/documents.service.js';
import { showToast } from '../../ui/toast.js';
import { assertEditable } from '../../services/document-status.service.js';

export async function renderDocumentFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  const documentId = context?.params?.id || context?.query?.id || null;

  const products = getProductsService();
  const warehouses = getWarehousesService();
  const existing = documentId ? getDocumentService(documentId) : null;

  if (documentId && !existing) {
    appRoot.innerHTML = `
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

  if (existing && !existing.canEdit) {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Edição bloqueada</h2>
          <p>Apenas documentos em draft podem ser editados.</p>
          <div class="page-actions">
            <a href="#documents" class="btn btn-secondary">Voltar</a>
            <a href="#documents/view?id=${existing.id}" class="btn btn-primary">Ver documento</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  let lines = existing?.lines?.length
    ? existing.lines.map((line) => ({
        product_id: line.product_id || '',
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      }))
    : [{ product_id: '', quantity: 1, unitPrice: 0 }];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header">
        <div>
          <h1>${documentId ? 'Editar Documento' : 'Novo Documento'}</h1>
          <p>Preenchimento operacional com validação antes de guardar.</p>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Voltar</a>
          <button class="btn btn-primary" id="save-document">Guardar</button>
        </div>
      </div>

      <div class="card">
        <div class="document-form-grid">
          <div class="form-group">
            <label>Data</label>
            <input type="date" id="doc-date" value="${existing?.date || ''}" />
          </div>

          <div class="form-group">
            <label>Tipo</label>
            <select id="doc-type">
              <option value="Transferência">Transferência</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </div>

          <div class="form-group">
            <label>Origem</label>
            <select id="doc-origin">
              <option value="">Selecionar</option>
              ${warehouses.map((warehouse) => `
                <option value="${warehouse.id}">${warehouse.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Destino</label>
            <select id="doc-destination">
              <option value="">Selecionar</option>
              ${warehouses.map((warehouse) => `
                <option value="${warehouse.id}">${warehouse.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="document-form__section-header">
          <h3>Linhas</h3>
          <button class="btn btn-secondary" id="add-line" type="button">+ Linha</button>
        </div>

        <div id="lines-container"></div>
      </div>

      <div class="card document-totals-card">
        <div class="document-total-item">
          <span>Total</span>
          <strong id="doc-total">0.00</strong>
        </div>
      </div>
    </section>
  `;

  setInitialValues();
  renderLines();
  bindEvents();
  syncTypeRules();

  function setInitialValues() {
    if (!existing) return;

    document.getElementById('doc-type').value = existing.type || 'Transferência';

    const origin = warehouses.find((warehouse) => warehouse.name === existing.origin);
    const destination = warehouses.find((warehouse) => warehouse.name === existing.destination);

    if (origin) {
      document.getElementById('doc-origin').value = origin.id;
    }

    if (destination) {
      document.getElementById('doc-destination').value = destination.id;
    }
  }

  function renderLines() {
    const container = document.getElementById('lines-container');

    container.innerHTML = lines
      .map((line, index) => `
        <div class="document-line" data-index="${index}" style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;margin-bottom:10px;">
          <select class="line-product">
            <option value="">Produto</option>
            ${products.map((product) => `
              <option value="${product.id}" ${product.id === line.product_id ? 'selected' : ''}>
                ${product.label}
              </option>
            `).join('')}
          </select>

          <input type="number" class="line-qty" value="${line.quantity}" min="0" step="0.01" />
          <input type="number" class="line-price" value="${line.unitPrice}" min="0" step="0.01" />
          <button class="btn btn-danger remove-line" type="button">X</button>
        </div>
      `)
      .join('');

    updateTotal();
  }

  function bindEvents() {
    document.getElementById('add-line').onclick = () => {
      lines.push({ product_id: '', quantity: 1, unitPrice: 0 });
      renderLines();
    };

    document.getElementById('doc-type').addEventListener('change', syncTypeRules);

    document.getElementById('lines-container').addEventListener('input', (event) => {
      const row = event.target.closest('.document-line');
      if (!row) return;

      const index = Number(row.dataset.index);

      lines[index].product_id = row.querySelector('.line-product').value;
      lines[index].quantity = Number(row.querySelector('.line-qty').value);
      lines[index].unitPrice = Number(row.querySelector('.line-price').value);

      updateTotal();
    });

    document.getElementById('lines-container').addEventListener('click', (event) => {
      if (!event.target.classList.contains('remove-line')) return;

      const row = event.target.closest('.document-line');
      const index = Number(row.dataset.index);

      lines.splice(index, 1);
      renderLines();
    });

    document.getElementById('save-document').onclick = handleSave;
  }

  function syncTypeRules() {
    const type = document.getElementById('doc-type').value;
    const originSelect = document.getElementById('doc-origin');

    if (type === 'Ajuste') {
      originSelect.value = '';
      originSelect.disabled = true;
      return;
    }

    originSelect.disabled = false;
  }

  function updateTotal() {
    const total = lines.reduce((sum, line) => {
      return sum + Number(line.quantity || 0) * Number(line.unitPrice || 0);
    }, 0);

    document.getElementById('doc-total').textContent = total.toFixed(2);
  }

  function validateBeforeSave(data) {
    if (!data.date) return 'Data obrigatória.';
    if (!data.type) return 'Tipo obrigatório.';

    if (data.type === 'Transferência') {
      if (!data.origin) return 'Origem obrigatória.';
      if (!data.destination) return 'Destino obrigatório.';
      if (data.origin === data.destination) return 'Origem e destino não podem ser iguais.';
    }

    if (data.type === 'Ajuste') {
      if (!data.destination) return 'Destino obrigatório.';
    }

    if (!data.lines.length) return 'Adicione pelo menos uma linha.';

    for (let index = 0; index < data.lines.length; index += 1) {
      const line = data.lines[index];

      if (!line.product_id) return `Linha ${index + 1}: selecione produto.`;
      if (Number(line.quantity || 0) <= 0) return `Linha ${index + 1}: quantidade inválida.`;
      if (Number(line.unitPrice || 0) < 0) return `Linha ${index + 1}: preço inválido.`;
    }

    return null;
  }

  function handleSave() {
    const payload = {
      id: documentId,
      date: document.getElementById('doc-date').value,
      type: document.getElementById('doc-type').value,
      origin: document.getElementById('doc-origin').value,
      destination: document.getElementById('doc-destination').value,
      lines,
    };

    const validationError = validateBeforeSave(payload);

    if (documentId) {
  try {
    assertEditable(documentId);
  } catch (err) {
    showToast(err.message, 'error');
    return;
  }
}
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    

    try {
      const saved = saveDocumentService(payload);

      showToast('Documento guardado com sucesso.', 'success');
      window.location.hash = `#documents/view?id=${saved.id}`;
    } catch (error) {
      console.error(error);
      showToast(error?.message || 'Erro ao guardar documento.', 'error');
    }
  }
}
