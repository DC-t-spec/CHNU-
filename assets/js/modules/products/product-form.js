import { createProduct } from '../../services/products.service.js';
import { showToast } from '../../ui/toast.js';
import { navigateTo } from '../../core/router.js';

function renderFormLayout() {
  return `
    <section class="page-shell products-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>Novo produto</h1>
          <p>Preencha os dados principais do produto para cadastro no sistema.</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="#products" class="btn btn-secondary">Cancelar</a>
          <button type="submit" form="product-form" class="btn btn-primary" id="save-product-btn">Guardar produto</button>
        </div>
      </div>

      <div class="card" style="max-width:980px;">
        <form id="product-form" style="display:grid;gap:18px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
            <div class="form-group">
              <label for="product-code">Código *</label>
              <input id="product-code" name="code" class="toolbar__input" maxlength="80" placeholder="Ex.: PRD-1001" required />
            </div>

            <div class="form-group">
              <label for="product-name">Nome *</label>
              <input id="product-name" name="name" class="toolbar__input" maxlength="180" placeholder="Nome do produto" required />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
            <div class="form-group">
              <label for="product-price">Preço de venda *</label>
              <input id="product-price" name="price" class="toolbar__input" type="number" min="0" step="0.01" required />
            </div>

            <div class="form-group">
              <label for="product-cost">Custo *</label>
              <input id="product-cost" name="cost" class="toolbar__input" type="number" min="0" step="0.01" required />
            </div>

            <div class="form-group">
              <label for="product-unit">Unidade</label>
              <input id="product-unit" name="unit" class="toolbar__input" maxlength="20" placeholder="Ex.: UN, KG, CX" />
            </div>

            <div class="form-group">
              <label for="product-min-qty">Qtd. mínima</label>
              <input id="product-min-qty" name="min_qty" class="toolbar__input" type="number" min="0" step="0.01" value="0" />
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
    price: Number(document.getElementById('product-price')?.value || NaN),
    cost: Number(document.getElementById('product-cost')?.value || NaN),
    unit: document.getElementById('product-unit')?.value || '',
    min_qty: Number(document.getElementById('product-min-qty')?.value || 0),
  };
}

export async function renderProductFormPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  appRoot.innerHTML = renderFormLayout();

  const form = document.getElementById('product-form');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = readFormPayload();

    try {
      const created = await createProduct(payload);
      showToast(`Produto ${created?.name || payload.name} criado com sucesso.`, 'success');
      navigateTo('#products');
    } catch (error) {
      showToast(error?.message || 'Erro ao criar produto.', 'error');
    }
  });
}
