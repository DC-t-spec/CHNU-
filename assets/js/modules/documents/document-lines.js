function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createEmptyLine() {
  return {
    itemCode: '',
    itemName: '',
    description: '',
    quantity: 1,
    unit: 'un',
    unitPrice: 0,
    total: 0,
  };
}

export function normalizeLine(line = {}) {
  const quantity = toNumber(line.quantity, 0);
  const unitPrice = toNumber(line.unitPrice, 0);

  return {
    itemCode: line.itemCode ?? '',
    itemName: line.itemName ?? '',
    description: line.description ?? '',
    quantity,
    unit: line.unit ?? 'un',
    unitPrice,
    total: quantity * unitPrice,
  };
}

export function normalizeLines(lines = []) {
  return (Array.isArray(lines) ? lines : [])
    .map(normalizeLine)
    .filter((line) => line.itemName || line.description || line.quantity > 0 || line.unitPrice > 0);
}

export function computeDocumentTotals(lines = []) {
  const normalized = normalizeLines(lines);

  return {
    linesCount: normalized.length,
    grandTotal: normalized.reduce((sum, line) => sum + line.total, 0),
  };
}

function createLineRowHtml(line = {}) {
  const normalized = normalizeLine(line);

  return `
    <tr class="document-line-row">
      <td>
        <input type="text" name="itemCode" value="${escapeHtml(normalized.itemCode)}" placeholder="Código" />
      </td>
      <td>
        <input type="text" name="itemName" value="${escapeHtml(normalized.itemName)}" placeholder="Item" />
      </td>
      <td>
        <input type="text" name="description" value="${escapeHtml(normalized.description)}" placeholder="Descrição" />
      </td>
      <td>
        <input type="number" name="quantity" min="0" step="0.01" value="${normalized.quantity}" />
      </td>
      <td>
        <input type="text" name="unit" value="${escapeHtml(normalized.unit)}" placeholder="Un" />
      </td>
      <td>
        <input type="number" name="unitPrice" min="0" step="0.01" value="${normalized.unitPrice}" />
      </td>
      <td>
        <div class="line-total js-line-total">${normalized.total.toFixed(2)}</div>
      </td>
      <td>
        <button type="button" class="btn btn-ghost btn-sm js-remove-line">Remover</button>
      </td>
    </tr>
  `;
}

export function renderDocumentLines(target, lines = []) {
  const container =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!container) return;

  const safeLines = Array.isArray(lines) && lines.length ? lines : [createEmptyLine()];

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div>
          <h3>Linhas do documento</h3>
          <p>Itens, quantidades e valores.</p>
        </div>
        <button type="button" class="btn btn-secondary js-add-line">Adicionar linha</button>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Item</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Un</th>
              <th>Preço Unit.</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="js-document-lines-body">
            ${safeLines.map(createLineRowHtml).join('')}
          </tbody>
        </table>
      </div>

      <div class="document-lines-summary" style="display:flex;justify-content:flex-end;gap:24px;margin-top:16px;">
        <div><strong>Linhas:</strong> <span class="js-lines-count">0</span></div>
        <div><strong>Total:</strong> <span class="js-grand-total">0.00</span></div>
      </div>
    </div>
  `;

  bindDocumentLines(container);
  updateDocumentLinesSummary(container);
}

export function bindDocumentLines(target) {
  const container =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!container) return;

  const body = container.querySelector('.js-document-lines-body');
  const addBtn = container.querySelector('.js-add-line');

  if (!body || !addBtn) return;

  addBtn.addEventListener('click', () => {
    body.insertAdjacentHTML('beforeend', createLineRowHtml(createEmptyLine()));
    updateDocumentLinesSummary(container);
  });

  body.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.js-remove-line');
    if (!removeBtn) return;

    const rows = body.querySelectorAll('.document-line-row');
    if (rows.length <= 1) {
      const onlyRow = rows[0];
      if (!onlyRow) return;

      onlyRow.querySelectorAll('input').forEach((input) => {
        if (input.name === 'quantity') input.value = '1';
        else if (input.name === 'unit') input.value = 'un';
        else if (input.name === 'unitPrice') input.value = '0';
        else input.value = '';
      });

      const totalEl = onlyRow.querySelector('.js-line-total');
      if (totalEl) totalEl.textContent = '0.00';

      updateDocumentLinesSummary(container);
      return;
    }

    removeBtn.closest('.document-line-row')?.remove();
    updateDocumentLinesSummary(container);
  });

  body.addEventListener('input', (event) => {
    const row = event.target.closest('.document-line-row');
    if (!row) return;

    updateLineTotal(row);
    updateDocumentLinesSummary(container);
  });
}

export function updateLineTotal(row) {
  const quantity = toNumber(row.querySelector('[name="quantity"]')?.value, 0);
  const unitPrice = toNumber(row.querySelector('[name="unitPrice"]')?.value, 0);
  const total = quantity * unitPrice;

  const totalEl = row.querySelector('.js-line-total');
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

export function getDocumentLines(target) {
  const container =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!container) return [];

  const rows = [...container.querySelectorAll('.document-line-row')];

  return rows
    .map((row) => ({
      itemCode: row.querySelector('[name="itemCode"]')?.value?.trim() ?? '',
      itemName: row.querySelector('[name="itemName"]')?.value?.trim() ?? '',
      description: row.querySelector('[name="description"]')?.value?.trim() ?? '',
      quantity: toNumber(row.querySelector('[name="quantity"]')?.value, 0),
      unit: row.querySelector('[name="unit"]')?.value?.trim() || 'un',
      unitPrice: toNumber(row.querySelector('[name="unitPrice"]')?.value, 0),
    }))
    .filter((line) => line.itemName || line.description || line.quantity > 0 || line.unitPrice > 0)
    .map(normalizeLine);
}

export function updateDocumentLinesSummary(target) {
  const container =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (!container) return;

  const lines = getDocumentLines(container);
  const totals = computeDocumentTotals(lines);

  const linesCountEl = container.querySelector('.js-lines-count');
  const grandTotalEl = container.querySelector('.js-grand-total');

  if (linesCountEl) linesCountEl.textContent = String(totals.linesCount);
  if (grandTotalEl) grandTotalEl.textContent = totals.grandTotal.toFixed(2);
}
