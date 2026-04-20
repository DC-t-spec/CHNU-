import {
  getDocumentById,
  saveDocument,
  getProducts,
  getWarehouses,
  getDocumentTypeOptions,
} from '../../services/documents.service.js';
import { showToast } from '../../ui/toast.js';
import { assertEditableDocument } from '../../services/document-status.service.js';
import { initDocumentLines } from './document-lines.js';

export async function renderDocumentFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const documentId = context?.params?.id || context?.query?.id || null;
  const products = getProducts();
  const warehouses = getWarehouses();
  const typeOptions = getDocumentTypeOptions();
  const existing = documentId ? getDocumentById(documentId) : null;

  if (documentId && !existing) {
    appRoot.innerHTML = `<section class="page-shell"><div class="card"><h2>Documento não encontrado</h2><a href="#documents" class="btn btn-primary">Voltar</a></div></section>`;
    return;
  }

  if (documentId && existing) {
    try {
      assertEditableDocument(documentId);
    } catch (error) {
      appRoot.innerHTML = `<section class="page-shell"><div class="card"><h2>Edição bloqueada</h2><p>${escapeHtml(error.message)}</p><a href="#documents/view?id=${existing.id}" class="btn btn-primary">Ver documento</a></div></section>`;
      return;
    }
  }

  const initialLines = existing?.lines?.length
    ? existing.lines.map((line) => ({
        id: line.id || crypto.randomUUID(),
        product_id: line.product_id || '',
        warehouse_id: line.warehouse_id || '',
        quantity: Number(line.qty || line.quantity || 0),
        unitPrice: Number(line.unit_cost || line.unitPrice || 0),
      }))
    : [{ id: crypto.randomUUID(), product_id: '', warehouse_id: '', quantity: 1, unitPrice: 0 }];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>${documentId ? 'Editar documento' : 'Novo documento'}</h1>
          <p>Document Engine PRO (draft → posted → cancelled).</p>
        </div>
        <div style="display:flex;gap:8px;">
          <a href="#documents" class="btn btn-secondary">Voltar</a>
          <button type="button" class="btn btn-primary" id="save-document-btn">Guardar draft</button>
        </div>
      </div>

      <div class="card" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
        <div class="form-group"><label>Data</label><input type="date" id="doc-date" class="toolbar__input" value="${escapeHtml(existing?.date || getTodayDate())}" /></div>
        <div class="form-group"><label>Tipo</label>
          <select id="doc-type" class="toolbar__select">${typeOptions.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Origem</label><select id="doc-origin" class="toolbar__select"><option value="">Selecionar</option>${warehouses.map((warehouse) => `<option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Destino</label><select id="doc-destination" class="toolbar__select"><option value="">Selecionar</option>${warehouses.map((warehouse) => `<option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>`).join('')}</select></div>
        <div class="form-group" style="grid-column:1 / -1;"><label>Notas</label><textarea id="doc-notes" class="toolbar__input" rows="3">${escapeHtml(existing?.notes || '')}</textarea></div>
      </div>

      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>Linhas</h3><button type="button" class="btn btn-secondary" id="add-line-btn">+ Linha</button></div><div id="document-lines"></div></div>
      <div class="card" style="display:flex;justify-content:flex-end;gap:24px;"><div>Linhas: <strong id="doc-lines-count">0</strong></div><div>Total Qtd: <strong id="doc-total-qty">0</strong></div><div>Total Valor: <strong id="doc-total">0.00</strong></div></div>
    </section>
  `;

  applyInitialHeaderValues();
  syncTypeRules();

  const linesController = initDocumentLines({
    containerSelector: '#document-lines',
    addButtonSelector: '#add-line-btn',
    products,
    warehouses,
    initialLines,
    onChange: handleLinesChange,
  });

  document.getElementById('doc-type')?.addEventListener('change', syncTypeRules);
  document.getElementById('save-document-btn')?.addEventListener('click', () => {
    const payload = {
      id: documentId,
      date: document.getElementById('doc-date')?.value || '',
      type: document.getElementById('doc-type')?.value || '',
      origin: document.getElementById('doc-origin')?.value || '',
      destination: document.getElementById('doc-destination')?.value || '',
      notes: document.getElementById('doc-notes')?.value || '',
      lines: linesController.getLines().map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice || 0),
      })),
    };

    const validationError = validateBeforeSave(payload);
    if (validationError) {
      showToast({ type: 'error', message: validationError });
      return;
    }

    try {
      const saved = saveDocument(payload);
      showToast({ type: 'success', message: 'Draft guardado com sucesso.' });
      window.location.hash = `#documents/view?id=${saved.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao guardar documento.' });
    }
  });

  function applyInitialHeaderValues() {
    const typeSelect = document.getElementById('doc-type');
    const originSelect = document.getElementById('doc-origin');
    const destinationSelect = document.getElementById('doc-destination');

    if (existing?.type && typeSelect) typeSelect.value = existing.type;

    if (existing?.origin && originSelect) {
      const originWarehouse = warehouses.find((warehouse) => warehouse.name === existing.origin || warehouse.id === existing.origin);
      if (originWarehouse) originSelect.value = originWarehouse.id;
    }

    if (existing?.destination && destinationSelect) {
      const destinationWarehouse = warehouses.find((warehouse) => warehouse.name === existing.destination || warehouse.id === existing.destination);
      if (destinationWarehouse) destinationSelect.value = destinationWarehouse.id;
    }
  }

  function syncTypeRules() {
    const type = document.getElementById('doc-type')?.value;
    const originSelect = document.getElementById('doc-origin');

    if (!originSelect) return;
    originSelect.disabled = ['stock_entry', 'stock_adjustment', 'stock_return'].includes(type);
    if (originSelect.disabled) originSelect.value = '';
  }

  function handleLinesChange(summary) {
    const countEl = document.getElementById('doc-lines-count');
    const totalEl = document.getElementById('doc-total');
    const totalQtyEl = document.getElementById('doc-total-qty');

    if (countEl) countEl.textContent = String(summary.linesCount || 0);
    if (totalEl) totalEl.textContent = formatCurrency(summary.grandTotal || 0);
    if (totalQtyEl) totalQtyEl.textContent = String(Number(summary.totalQty || 0).toFixed(2));
  }
}

function validateBeforeSave(data) {
  if (!data.date) return 'Data obrigatória.';
  if (!data.type) return 'Tipo obrigatório.';
  if (!Array.isArray(data.lines) || !data.lines.length) return 'Adicione pelo menos uma linha.';

  for (let index = 0; index < data.lines.length; index += 1) {
    const line = data.lines[index];
    if (!line.product_id) return `Linha ${index + 1}: product_id obrigatório.`;
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return `Linha ${index + 1}: qty > 0.`;
  }

  if (data.type === 'stock_transfer') {
    if (!data.origin || !data.destination) return 'Transferência exige origem e destino.';
    if (data.origin === data.destination) return 'Origem e destino não podem ser iguais.';
  }

  if (['stock_entry', 'stock_adjustment', 'stock_return'].includes(data.type) && !data.destination) {
    return 'Destino obrigatório para este tipo.';
  }

  if (data.type === 'stock_exit' && !data.origin) {
    return 'Origem obrigatória para saída de stock.';
  }

  return null;
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
