// assets/js/modules/documents/document-detail.page.js

import {
  getDocument,
  postDocumentService,
  cancelDocumentService,
} from '../../services/documents.service.js';

import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function renderDocumentDetailPage(params = {}) {
  const app = document.querySelector('#app');
  const { id } = params;

  const doc = getDocument(id);

  if (!doc) {
    app.innerHTML = `<div class="page"><h2>Document not found</h2></div>`;
    return;
  }

  app.innerHTML = `
    <div class="page">

      <div class="page-header">
        <h1>Document ${doc.number}</h1>
        <div class="actions">
          <a href="#/documents" class="btn">Back</a>

          ${doc.status === 'draft' ? `
            <a href="#/documents/${doc.id}/edit" class="btn">Edit</a>
            <button id="post-btn" class="btn btn-primary">Post</button>
          ` : ''}

          ${doc.status === 'posted' ? `
            <button id="cancel-btn" class="btn btn-danger">Cancel</button>
          ` : ''}
        </div>
      </div>

      <div class="card">
        <div><strong>Status:</strong> ${doc.status}</div>
        <div><strong>Date:</strong> ${doc.date}</div>
        <div><strong>Type:</strong> ${doc.type}</div>
        <div><strong>Origin:</strong> ${doc.origin || '-'}</div>
        <div><strong>Destination:</strong> ${doc.destination || '-'}</div>
      </div>

      <div class="card">
        <h3>Lines</h3>

        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${doc.lines.map(line => `
              <tr>
                <td>${line.item}</td>
                <td>${line.quantity}</td>
                <td>${line.unitPrice || 0}</td>
                <td>${(line.quantity * (line.unitPrice || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card total">
        <h2>Total: ${doc.grandTotal}</h2>
      </div>

    </div>
  `;

  bindEvents(doc);
}

function bindEvents(doc) {
  const postBtn = document.getElementById('post-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const confirm = await showConfirm('Post this document?');
      if (!confirm) return;

      await postDocumentService(doc.id);
      showToast('Document posted');

      location.hash = `#/documents/${doc.id}`;
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      const confirm = await showConfirm('Cancel this document?');
      if (!confirm) return;

      await cancelDocumentService(doc.id, null, 'User cancel');
      showToast('Document cancelled');

      location.hash = `#/documents/${doc.id}`;
    });
  }
}
