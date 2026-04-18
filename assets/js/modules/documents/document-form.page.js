// assets/js/modules/documents/document-form.page.js

import {
  getDocument,
  createNewDocument,
  updateExistingDocument,
} from '../../services/documents.service.js';

import { showToast } from '../../ui/toast.js';

export async function renderDocumentFormPage(params = {}) {
  const app = document.querySelector('#app');

  const isEdit = !!params.id;
  const doc = isEdit ? getDocument(params.id) : null;

  app.innerHTML = `
    <div class="page">

      <div class="page-header">
        <h1>${isEdit ? 'Edit Document' : 'New Document'}</h1>
        <a href="#/documents" class="btn">Back</a>
      </div>

      <div class="card">

        <div class="form-group">
          <label>Type</label>
          <input id="type" value="${doc?.type || ''}" />
        </div>

        <div class="form-group">
          <label>Date</label>
          <input id="date" type="date" value="${doc?.date || ''}" />
        </div>

        <div class="form-group">
          <label>Origin</label>
          <input id="origin" value="${doc?.origin || ''}" />
        </div>

        <div class="form-group">
          <label>Destination</label>
          <input id="destination" value="${doc?.destination || ''}" />
        </div>

      </div>

      <div class="card">
        <h3>Lines</h3>

        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="lines-body"></tbody>
        </table>

        <button id="add-line" class="btn">Add Line</button>
      </div>

      <div class="card">
        <button id="save-btn" class="btn btn-primary">Save</button>
      </div>

    </div>
  `;

  let lines = doc?.lines ? [...doc.lines] : [];

  function renderLines() {
    const tbody = document.getElementById('lines-body');

    tbody.innerHTML = lines.map((line, index) => `
      <tr>
        <td><input data-field="item" data-index="${index}" value="${line.item || ''}" /></td>
        <td><input data-field="quantity" data-index="${index}" type="number" value="${line.quantity || 0}" /></td>
        <td><input data-field="unitPrice" data-index="${index}" type="number" value="${line.unitPrice || 0}" /></td>
        <td><button data-remove="${index}" class="btn btn-danger">X</button></td>
      </tr>
    `).join('');

    bindLineEvents();
  }

  function bindLineEvents() {
    document.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = e.target.dataset.index;
        const field = e.target.dataset.field;

        lines[index][field] = field === 'quantity' || field === 'unitPrice'
          ? Number(e.target.value)
          : e.target.value;
      });
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.remove);
        lines.splice(index, 1);
        renderLines();
      });
    });
  }

  document.getElementById('add-line').addEventListener('click', () => {
    lines.push({ item: '', quantity: 0, unitPrice: 0 });
    renderLines();
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const payload = {
      type: document.getElementById('type').value,
      date: document.getElementById('date').value,
      origin: document.getElementById('origin').value,
      destination: document.getElementById('destination').value,
      lines,
    };

    if (isEdit) {
      updateExistingDocument(doc.id, payload);
      showToast('Document updated');
      location.hash = `#/documents/${doc.id}`;
    } else {
      const newDoc = createNewDocument(payload);
      showToast('Document created');
      location.hash = `#/documents/${newDoc.id}`;
    }
  });

  renderLines();
}
