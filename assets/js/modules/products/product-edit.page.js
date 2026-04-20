import { getProductById, updateProduct } from '../../services/products.service.js';
import { navigateTo } from '../../core/router.js';

function toInputValue(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderFormLayout(product) {
  return `
    <section class="page-shell products-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>Editar produto</h1>
          <p>Atualize os dados principais do produto.</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" id="cancel-edit-product-btn">Cancelar</button>
          <button type="submit" form="product-edit-form" class="btn btn-primary">Guardar alterações</button>
        </div>
      </div>

      <div class="card" style="max-width:980px;">
        <form id="product-edit-form" style="display:grid;gap:18px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
            <div class="form-group">
              <label for="product-code">Código *</label>
              <input id="product-code" name="code" class="toolbar__input" maxlength="80" value="${escapeHtmlAttr(toInputValue(product.code))}" required />
            </div>

            <div class="form-group">
              <label for="product-name">Nome *</label>
              <input id="product-name" name="name" class="toolbar__input" maxlength="180" value="${escapeHtmlAttr(toInputValue(product.name))}" required />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
            <div class="form-group">
              <label for="product-price">Preço de venda *</label>
              <input id="product-price" name="price" class="toolbar__input" type="number" min="0" step="0.01" value="${escapeHtmlAttr(toInputValue(product.price, '0'))}" required />
            </div>

            <div class="form-group">
              <label for="product-cost">Custo *</label>
              <input id="product-cost" name="cost" class="toolbar__input" type="number" min="0" step="0.01" value="${escapeHtmlAttr(toInputValue(product.cost, '0'))}" required />
            </div>

            <div class="form-group">
              <label for="product-unit">Unidade</label>
              <input id="product-unit" name="unit" class="toolbar__input" maxlength="20" value="${escapeHtmlAttr(toInputValue(product.unit))}" placeholder="Ex.: UN, KG, CX" />
            </div>

            <div class="form-group">
              <label for="product-min-qty">Qtd. mínima</label>
              <input id="product-min-qty" name="min_qty" class="toolbar__input" type="number" min="0" step="0.01" value="${escapeHtmlAttr(toInputValue(product.min_qty, '0'))}" />
            </div>
          </div>

          <p style="margin:0;color:#64748b;font-size:13px;">Campos marcados com * são obrigatórios.</p>
        </form>
      </div>
    </section>
  `;
}

function readFormPayload() {
  return {
    code: document.getElementById('product-code')?.value || '',
    name: document.getElementById('product-name')?.value || '',
    price: parseFloat(document.getElementById('product-price')?.value || 'NaN'),
    cost: parseFloat(document.getElementById('product-cost')?.value || 'NaN'),
    unit: document.getElementById('product-unit')?.value || '',
    min_qty: parseFloat(document.getElementById('product-min-qty')?.value || '0'),
  };
}

export async function renderProductEditPage({ params } = {}) {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const productId = params?.id;
  if (!productId) {
    alert('Produto inválido para edição.');
    navigateTo('/products');
    return;
  }

  const product = await getProductById(productId);
  if (!product) {
    alert('Produto não encontrado.');
    navigateTo('/products');
    return;
  }

  appRoot.innerHTML = renderFormLayout(product);

  const cancelButton = document.getElementById('cancel-edit-product-btn');
  cancelButton?.addEventListener('click', () => {
    navigateTo('/products');
  });

  const form = document.getElementById('product-edit-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readFormPayload();

    try {
      await updateProduct(productId, payload);
      navigateTo('/products');
    } catch (error) {
      alert(error?.message || 'Erro ao atualizar produto.');
    }
  });
}
