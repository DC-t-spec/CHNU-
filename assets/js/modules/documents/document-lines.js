// assets/js/modules/documents/document-lines.js

export function initDocumentLines({
  containerSelector = '#document-lines',
  addButtonSelector = '#add-line-btn',
  products = [],
  warehouses = [],
  initialLines = [],
  onChange = () => {},
} = {}) {
  const container = document.querySelector(containerSelector);
  const addBtn = document.querySelector(addButtonSelector);

  if (!container) return;

  let lines = initialLines.length ? [...initialLines] : [createEmptyLine()];

  function createEmptyLine() {
    return {
      id: crypto.randomUUID(),
      product_id: '',
      warehouse_id: '',
      quantity: 0,
      unitPrice: 0,
      total: 0,
    };
  }

  function recalcLine(line) {
    line.quantity = Number(line.quantity || 0);
    line.unitPrice = Number(line.unitPrice || 0);
    line.total = line.quantity * line.unitPrice;
  }

  function recalcAll() {
    lines.forEach(recalcLine);
  }

  function getProductOptions(selected) {
    return products
      .map(
        (p) => `
        <option value="${p.id}" ${p.id === selected ? 'selected' : ''}>
          ${p.name}
        </option>
      `
      )
      .join('');
  }

  function getWarehouseOptions(selected) {
    return warehouses
      .map(
        (w) => `
        <option value="${w.id}" ${w.id === selected ? 'selected' : ''}>
          ${w.name}
        </option>
      `
      )
      .join('');
  }

  function render() {
    recalcAll();

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Armazém</th>
              <th>Qtd</th>
              <th>Preço</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${lines
              .map(
                (line) => `
                  <tr data-id="${line.id}">
                    <td>
                      <select class="line-product">
                        <option value="">Selecionar</option>
                        ${getProductOptions(line.product_id)}
                      </select>
                    </td>

                    <td>
                      <select class="line-warehouse">
                        <option value="">Selecionar</option>
                        ${getWarehouseOptions(line.warehouse_id)}
                      </select>
                    </td>

                    <td>
                      <input type="number" class="line-qty" value="${line.quantity}" min="0" />
                    </td>

                    <td>
                      <input type="number" class="line-price" value="${line.unitPrice}" min="0" step="0.01" />
                    </td>

                    <td>
                      <strong>${formatCurrency(line.total)}</strong>
                    </td>

                    <td>
                      <button class="btn btn-danger btn-sm remove-line">✕</button>
                    </td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    bindEvents();
    emitChange();
  }

  function bindEvents() {
    container.querySelectorAll('tr[data-id]').forEach((row) => {
      const id = row.dataset.id;
      const line = lines.find((l) => l.id === id);

      row.querySelector('.line-product').onchange = (e) => {
        line.product_id = e.target.value;
        emitChange();
      };

      row.querySelector('.line-warehouse').onchange = (e) => {
        line.warehouse_id = e.target.value;
        emitChange();
      };

      row.querySelector('.line-qty').oninput = (e) => {
        line.quantity = Number(e.target.value || 0);
        render();
      };

      row.querySelector('.line-price').oninput = (e) => {
        line.unitPrice = Number(e.target.value || 0);
        render();
      };

      row.querySelector('.remove-line').onclick = () => {
        if (lines.length === 1) return;
        lines = lines.filter((l) => l.id !== id);
        render();
      };
    });

    if (addBtn) {
      addBtn.onclick = () => {
        lines.push(createEmptyLine());
        render();
      };
    }
  }

  function emitChange() {
    recalcAll();

    const summary = {
      lines: lines.map((l) => ({ ...l })),
      linesCount: lines.length,
      grandTotal: lines.reduce((sum, l) => sum + l.total, 0),
    };

    onChange(summary);
  }

  render();

  return {
    getLines: () => lines,
    setLines: (newLines = []) => {
      lines = newLines.length ? [...newLines] : [createEmptyLine()];
      render();
    },
  };
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
