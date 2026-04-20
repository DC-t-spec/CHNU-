import {
  getDocumentById,
  saveDocument,
  getProducts,
  getWarehouses,
  getSuppliers,
} from '../../services/documents.service.js';
import { assertEditableDocument } from '../../services/document-status.service.js';
import { showToast } from '../../ui/toast.js';
import { initDocumentLines } from '../documents/document-lines.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function renderPurchaseFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const documentId = context?.params?.id || context?.query?.id || null;
  const existing = documentId ? getDocumentById(documentId) : null;

  if (documentId && (!existing || existing.type !== 'purchase')) {
    appRoot.innerHTML = '<section class="page-shell"><div class="card"><h2>Compra não encontrada</h2><a href="#purchases" class="btn btn-primary">Voltar</a></div></section>';
    return;
  }

  if (documentId && existing) {
    try {
      assertEditableDocument(documentId);
    } catch (error) {
      appRoot.innerHTML = `<section class="page-shell"><div class="card"><h2>Edição bloqueada</h2><p>${escapeHtml(error.message)}</p><a href="#purchases/view?id=${existing.id}" class="btn btn-primary">Ver compra</a></div></section>`;
      return;
    }
  }

  const products = getProducts();
  const warehouses = getWarehouses();
  const suppliers = getSuppliers();

  const initialLines = existing?.lines?.length
    ? existing.lines.map((line) => ({
      id: line.id || crypto.randomUUID(),
      product_id: line.product_id || '',
      quantity: Number(line.qty || 0),
      unitPrice: Number(line.unit_cost || 0),
    }))
    : [{ id: crypto.randomUUID(), product_id: '', quantity: 1, unitPrice: 0 }];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div><h1>${documentId ? 'Editar compra' : 'Nova compra'}</h1><p>Purchases PRO com total automático.</p></div>
        <div style="display:flex;gap:8px;"><a href="#purchases" class="btn btn-secondary">Voltar</a><button type="button" class="btn btn-primary" id="save-purchase-btn">Guardar draft</button></div>
      </div>

      <div class="card" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
        <div class="form-group"><label>Data</label><input type="date" id="purchase-date" class="toolbar__input" value="${escapeHtml(existing?.date || getTodayDate())}" /></div>
        <div class="form-group"><label>Fornecedor *</label><select id="purchase-supplier" class="toolbar__select"><option value="">Selecionar</option>${suppliers.map((supplier) => `<option value="${escapeHtml(supplier.id)}">${escapeHtml(supplier.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Destino *</label><select id="purchase-destination" class="toolbar__select"><option value="">Selecionar</option>${warehouses.map((warehouse) => `<option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>`).join('')}</select></div>
        <div class="form-group" style="grid-column:1 / -1;"><label>Notas</label><textarea id="purchase-notes" class="toolbar__input" rows="3">${escapeHtml(existing?.notes || '')}</textarea></div>
      </div>

      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>Linhas da compra</h3><button type="button" class="btn btn-secondary" id="add-line-btn">+ Linha</button></div><div id="document-lines"></div></div>

      <div class="card" style="display:flex;justify-content:flex-end;gap:24px;"><div>Linhas: <strong id="purchase-lines-count">0</strong></div><div>Total Qtd: <strong id="purchase-total-qty">0.00</strong></div><div>Total Compra: <strong id="purchase-total">0.00</strong></div></div>
    </section>
  `;

  if (existing?.supplier_id) document.getElementById('purchase-supplier').value = existing.supplier_id;
  if (existing?.destination) {
    const wh = warehouses.find((warehouse) => warehouse.name === existing.destination || warehouse.id === existing.destination);
    if (wh) document.getElementById('purchase-destination').value = wh.id;
  }

  const linesController = initDocumentLines({
    containerSelector: '#document-lines',
    addButtonSelector: '#add-line-btn',
    products,
    warehouses: [],
    initialLines,
    onChange: (summary) => {
      document.getElementById('purchase-lines-count').textContent = String(summary.linesCount || 0);
      document.getElementById('purchase-total-qty').textContent = Number(summary.totalQty || 0).toFixed(2);
      document.getElementById('purchase-total').textContent = formatMoney(summary.grandTotal || 0);
    },
  });

  document.getElementById('save-purchase-btn')?.addEventListener('click', () => {
    const payload = {
      id: documentId,
      type: 'purchase',
      date: document.getElementById('purchase-date')?.value || '',
      supplier_id: document.getElementById('purchase-supplier')?.value || '',
      destination: document.getElementById('purchase-destination')?.value || '',
      notes: document.getElementById('purchase-notes')?.value || '',
      lines: linesController.getLines().map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      })),
    };

    const validationError = validatePurchase(payload, warehouses, products, suppliers);
    if (validationError) {
      showToast({ type: 'error', message: validationError });
      return;
    }

    try {
      const saved = saveDocument(payload);
      showToast({ type: 'success', message: 'Compra em draft guardada.' });
      window.location.hash = `#purchases/view?id=${saved.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao guardar compra.' });
    }
  });
}

function validatePurchase(payload, warehouses, products, suppliers) {
  if (!payload.supplier_id) return 'Fornecedor obrigatório.';
  if (!suppliers.find((item) => item.id === payload.supplier_id)) return 'Fornecedor inválido.';
  if (!payload.destination) return 'Destino obrigatório.';
  if (!warehouses.find((item) => item.id === payload.destination)) return 'Destino inválido.';
  if (!Array.isArray(payload.lines) || !payload.lines.length) return 'Linhas obrigatórias.';

  for (let index = 0; index < payload.lines.length; index += 1) {
    const line = payload.lines[index];
    const row = index + 1;
    if (!line.product_id) return `Linha ${row}: produto obrigatório.`;
    if (!products.find((item) => item.id === line.product_id)) return `Linha ${row}: produto inválido.`;
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return `Linha ${row}: qty > 0.`;
    if (!Number.isFinite(line.unitPrice) || line.unitPrice <= 0) return `Linha ${row}: unit_cost > 0.`;
  }

  return null;
}
