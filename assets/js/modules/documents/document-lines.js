function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function createLine(products = [], warehouses = [], line = {}) {
  const product = products.find((item) => item.id === line.product_id) || null;
  const warehouse = warehouses.find((item) => item.id === line.warehouse_id) || null;

  return {
    id: line.id || crypto.randomUUID(),
    product_id: line.product_id || '',
    warehouse_id: line.warehouse_id || '',
    quantity: toNumber(line.quantity, 1),
    unitPrice: toNumber(
      line.unitPrice ?? line.unit_price ?? product?.unitPrice ?? product?.price ?? 0,
      0
    ),
    total: toNumber(line.total, 0),
    productName: product?.name || '',
    warehouseName: warehouse?.name || '',
  };
}

function calculateLineTotal(line) {
  return toNumber(line.quantity, 0) * toNumber(line.unitPrice, 0);
}

function buildSummary(lines = []) {
  const validLines = lines.filter((line) => line.product_id && toNumber(line.quantity, 0) > 0);

  return {
    linesCount: validLines.length,
    grandTotal: validLines.reduce((sum, line) => sum + calculateLineTotal(line), 0),
  };
}

function buildProductOptions(products = [], selectedId = '') {
  return `
    <option value="">Selecionar</option>
    ${products
      .map(
        (product) => `
          <option value="${escapeHtml(product.id)}" ${product.id === selectedId ? 'selected' : ''}>
            ${escapeHtml(product.name || product.code || product.id)}
          </option>
        `
      )
      .join('')}
  `;
}

function buildWarehouseOptions(warehouses = [], selectedId = '') {
  return `
    <option value="">Selecionar</option>
    ${warehouses
      .map(
        (warehouse) => `
          <option value="${escapeHtml(warehouse.id)}" ${warehouse.id === selectedId ? 'selected' : ''}>
            ${escapeHtml(warehouse.name || warehouse.code || warehouse.id)}
          </option>
        `
      )
      .join('')}
  `;
}

function buildRow(line, products = [], warehouses = []) {
  const total = calculateLineTotal(line);

  return `
    <tr class="document-line-row" data-line-id="${escapeHtml(line.id)}">
      <td>
        <select class="toolbar__select doc-line-product">
          ${buildProductOptions(products, line.product_id)}
        </select>
      </td>

      <td>
        <select class="toolbar__select doc-line-warehouse">
          ${buildWarehouseOptions(warehouses, line.warehouse_id)}
        </select>
      </td>

      <td>
        <input
          type="number"
          min="0.01"
          step="0.01"
          class="toolbar__input doc-line-quantity"
          value="${toNumber(line.quantity, 1)}"
        />
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          class="toolbar__input doc-line-unit-price"
          value="${toNumber(line.unitPrice, 0)}"
        />
      </td>

      <td class="doc-line-total-cell">${formatMoney(total)}</td>

      <td>
        <button type="button" class="btn btn-danger btn-sm doc-line-remove">
          Remover
        </button>
      </td>
    </tr>
  `;
}

function buildTable(lines = [], products = [], warehouses = []) {
  return `
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Armazém</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody id="document-lines-body">
          ${lines.map((line) => buildRow(line, products, warehouses)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function initDocumentLines({
  containerSelector,
  addButtonSelector,
  products = [],
  warehouses = [],
  initialLines = [],
  onChange = () => {},
} = {}) {
  const container = document.querySelector(containerSelector);
  const addButton = document.querySelector(addButtonSelector);

  if (!container) {
    throw new Error('Container das linhas não encontrado.');
  }

  let lines = Array.isArray(initialLines) && initialLines.length
    ? initialLines.map((line) => createLine(products, warehouses, line))
    : [createLine(products, warehouses, { quantity: 1, unitPrice: 0 })];

  function render() {
    container.innerHTML = buildTable(lines, products, warehouses);
    emitChange();
  }

  function emitChange() {
    const summary = buildSummary(lines);
    onChange(summary);
  }

  function syncRow(lineId, row) {
    const line = lines.find((item) => item.id === lineId);
    if (!line || !row) return;

    line.product_id = row.querySelector('.doc-line-product')?.value || '';
    line.warehouse_id = row.querySelector('.doc-line-warehouse')?.value || '';
    line.quantity = toNumber(row.querySelector('.doc-line-quantity')?.value, 0);
    line.unitPrice = toNumber(row.querySelector('.doc-line-unit-price')?.value, 0);
    line.total = calculateLineTotal(line);

    const selectedProduct = products.find((item) => item.id === line.product_id);
    if (selectedProduct) {
      line.productName = selectedProduct.name || '';
    }

    const totalCell = row.querySelector('.doc-line-total-cell');
    if (totalCell) {
      totalCell.textContent = formatMoney(line.total);
    }

    emitChange();
  }

  function addLine() {
    lines.push(
      createLine(products, warehouses, {
        quantity: 1,
        unitPrice: 0,
      })
    );

    render();
  }

  function removeLine(lineId) {
    if (lines.length === 1) {
      lines = [createLine(products, warehouses, { quantity: 1, unitPrice: 0 })];
      render();
      return;
    }

    lines = lines.filter((line) => line.id !== lineId);
    render();
  }

  container.addEventListener('input', (event) => {
    const row = event.target.closest('.document-line-row');
    if (!row) return;

    const lineId = row.dataset.lineId;
    syncRow(lineId, row);
  });

  container.addEventListener('change', (event) => {
    const row = event.target.closest('.document-line-row');
    if (!row) return;

    const lineId = row.dataset.lineId;

    if (event.target.classList.contains('doc-line-product')) {
      const line = lines.find((item) => item.id === lineId);
      const selectedProduct = products.find((item) => item.id === event.target.value);

      if (line && selectedProduct) {
        const nextPrice = toNumber(
          selectedProduct.unitPrice ?? selectedProduct.price ?? line.unitPrice,
          line.unitPrice
        );

        line.unitPrice = nextPrice;

        const unitPriceInput = row.querySelector('.doc-line-unit-price');
        if (unitPriceInput) {
          unitPriceInput.value = String(nextPrice);
        }
      }
    }

    syncRow(lineId, row);
  });

  container.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.doc-line-remove');
    if (!removeButton) return;

    const row = removeButton.closest('.document-line-row');
    if (!row) return;

    removeLine(row.dataset.lineId);
  });

  addButton?.addEventListener('click', addLine);

  render();

  return {
    getLines() {
      return lines.map((line) => ({
        id: line.id,
        product_id: line.product_id,
        warehouse_id: line.warehouse_id,
        quantity: toNumber(line.quantity, 0),
        unitPrice: toNumber(line.unitPrice, 0),
        total: calculateLineTotal(line),
      }));
    },

    getSummary() {
      return buildSummary(lines);
    },

    setLines(nextLines = []) {
      lines = Array.isArray(nextLines) && nextLines.length
        ? nextLines.map((line) => createLine(products, warehouses, line))
        : [createLine(products, warehouses, { quantity: 1, unitPrice: 0 })];

      render();
    },

    addLine,
  };
}
