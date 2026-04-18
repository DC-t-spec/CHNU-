// assets/js/modules/documents/document-form.page.js

import {
  getDocumentService,
  saveDocumentService,
  getWarehousesService,
} from '../../services/documents.service.js';

export async function renderDocumentFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  const documentId = context?.params?.id || context?.query?.id || null;

  const warehouses = getWarehousesService();
  const existing = documentId ? getDocumentService(documentId) : null;

  let lines = existing?.lines?.length
    ? [...existing.lines]
    : [{ item: '', quantity: 1, unitPrice: 0 }];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header">
        <div>
          <h1>${documentId ? 'Editar Documento' : 'Novo Documento'}</h1>
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
              <option value="transfer">Transferência</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div class="form-group">
            <label>Origem</label>
            <select id="doc-origin">
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Destino</label>
            <select id="doc-destination">
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
            </select>
          </div>

        </div>
      </div>

      <div class="card">
        <div class="document-form__section-header">
          <h3>Linhas</h3>
          <button class="btn btn-secondary" id="add-line">+ Linha</button>
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

  renderLines();
  bindEvents();

  function renderLines() {
    const container = document.getElementById('lines-container');

    container.innerHTML = lines
      .map((l, i) => `
        <div class="document-line" data-index="${i}" style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;margin-bottom:10px;">
          <input type="text" placeholder="Item" value="${l.item}" class="line-item"/>
          <input type="number" value="${l.quantity}" class="line-qty"/>
          <input type="number" value="${l.unitPrice}" class="line-price"/>
          <button class="btn btn-danger remove-line">X</button>
        </div>
      `)
      .join('');

    updateTotal();
  }

  function bindEvents() {
    document.getElementById('add-line').onclick = () => {
      lines.push({ item: '', quantity: 1, unitPrice: 0 });
      renderLines();
    };

    document.getElementById('lines-container').addEventListener('input', (e) => {
      const row = e.target.closest('.document-line');
      if (!row) return;

      const i = Number(row.dataset.index);

      lines[i].item = row.querySelector('.line-item').value;
      lines[i].quantity = Number(row.querySelector('.line-qty').value);
      lines[i].unitPrice = Number(row.querySelector('.line-price').value);

      updateTotal();
    });

    document.getElementById('lines-container').addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-line')) return;

      const row = e.target.closest('.document-line');
      const i = Number(row.dataset.index);

      lines.splice(i, 1);
      renderLines();
    });

    document.getElementById('save-document').onclick = handleSave;
  }

  function updateTotal() {
    const total = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
    document.getElementById('doc-total').textContent = total.toFixed(2);
  }

  function handleSave() {
    const data = {
      id: documentId,
      date: document.getElementById('doc-date').value,
      type: document.getElementById('doc-type').value,
      origin: document.getElementById('doc-origin').value,
      destination: document.getElementById('doc-destination').value,
      lines,
    };

    saveDocumentService(data);

    window.location.hash = '#documents';
  }
}
