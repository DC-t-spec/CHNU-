import {
  getDocumentById,
  createDocument,
  updateDocument,
  getWarehouses,
} from '../../core/state.js';
import {
  bindDocumentLinesEvents,
  renderDocumentLinesSection,
} from './document-lines.js';

function renderDocumentTypeOptions(selectedValue = '') {
  const documentTypes = ['Transferência', 'Ajuste'];

  return `
    <option value="">Seleccionar tipo</option>
    ${documentTypes
      .map((type) => {
        const selected = type === selectedValue ? 'selected' : '';
        return `<option value="${type}" ${selected}>${type}</option>`;
      })
      .join('')}
  `;
}

function renderWarehouseOptions(selectedValue = '') {
  const warehouses = getWarehouses() || [];

  return `
    <option value="">Seleccionar armazém</option>
    ${warehouses
      .map((warehouse) => {
        const selected = warehouse.name === selectedValue ? 'selected' : '';
        return `<option value="${warehouse.name}" ${selected}>${warehouse.name}</option>`;
      })
      .join('')}
  `;
}

export async function renderDocumentFormPage({ route, params }) {
  const appRoot = document.querySelector('#app');
  const isEditMode = route === '/documents/edit';
  const documentId = params.id;
  const existingDocument = isEditMode ? getDocumentById(documentId) : null;

  if (isEditMode && !existingDocument) {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Documento não encontrado</h2>
          <p>Não foi possível abrir o documento para edição.</p>
          <a href="#documents" class="btn btn-primary">Voltar à lista</a>
        </div>
      </section>
    `;
    return;
  }

  if (isEditMode && existingDocument.status !== 'draft') {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Edição não permitida</h2>
          <p>Apenas documentos em draft podem ser editados.</p>
          <a href="#documents/view?id=${existingDocument.id}" class="btn btn-primary">Ver documento</a>
        </div>
      </section>
    `;
    return;
  }

  const documentData = existingDocument || {
    date: '',
    type: '',
    origin: '',
    destination: '',
  };

  appRoot.innerHTML = `
    <section class="page-shell document-form-page">
      <div class="page-header">
        <div>
          <h1>${isEditMode ? 'Editar documento' : 'Novo documento'}</h1>
          <p>${isEditMode ? 'Actualizar documento em draft' : 'Criar novo documento operacional'}</p>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Cancelar</a>
          ${
            isEditMode
              ? `<a href="#documents/view?id=${existingDocument.id}" class="btn btn-secondary">Ver detalhe</a>`
              : ''
          }
        </div>
      </div>

      <div class="card">
        <form id="document-form" data-mode="${isEditMode ? 'edit' : 'create'}" data-id="${existingDocument?.id || ''}">
          <div class="form-grid">
            <div class="form-field">
              <label for="date">Data</label>
              <input id="date" name="date" type="date" value="${documentData.date}" required />
            </div>

            <div class="form-field">
              <label for="type">Tipo</label>
              <select id="type" name="type" required>
                ${renderDocumentTypeOptions(documentData.type)}
              </select>
            </div>

            <div class="form-field">
              <label for="origin">Origem</label>
              <select id="origin" name="origin">
                ${renderWarehouseOptions(documentData.origin)}
              </select>
            </div>

            <div class="form-field">
              <label for="destination">Destino</label>
              <select id="destination" name="destination" required>
                ${renderWarehouseOptions(documentData.destination)}
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${isEditMode ? 'Guardar alterações' : 'Criar documento'}
            </button>
          </div>
        </form>
      </div>

      ${
        isEditMode
          ? renderDocumentLinesSection(existingDocument)
          : `
            <div class="card">
              <h2>Linhas do documento</h2>
              <p>Primeiro cria o documento. Depois poderás adicionar linhas e calcular totais.</p>
            </div>
          `
      }
    </section>
  `;

  bindDocumentForm();

  if (isEditMode) {
    bindDocumentLinesEvents(existingDocument.id);
  }
}

function bindDocumentForm() {
  const form = document.querySelector('#document-form');
  const typeField = document.querySelector('#type');
  const originField = document.querySelector('#origin');
  const destinationField = document.querySelector('#destination');

  if (!form) return;

  function applyDocumentTypeRules() {
    const type = typeField?.value || '';

    if (!originField || !destinationField) return;

    if (type === 'Ajuste') {
      originField.value = '';
      originField.disabled = true;
      originField.removeAttribute('required');

      destinationField.disabled = false;
      destinationField.setAttribute('required', 'required');
    } else if (type === 'Transferência') {
      originField.disabled = false;
      originField.setAttribute('required', 'required');

      destinationField.disabled = false;
      destinationField.setAttribute('required', 'required');
    } else {
      originField.disabled = false;
      originField.removeAttribute('required');

      destinationField.disabled = false;
      destinationField.removeAttribute('required');
    }
  }

  typeField?.addEventListener('change', applyDocumentTypeRules);
  applyDocumentTypeRules();

  form.addEventListener('submit', handleDocumentSubmit);
}

function handleDocumentSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const payload = {
    date: formData.get('date')?.trim(),
    type: formData.get('type')?.trim(),
    origin: formData.get('origin')?.trim(),
    destination: formData.get('destination')?.trim(),
  };

  if (!payload.type) {
    alert('Selecciona o tipo de documento.');
    return;
  }

  if (payload.type === 'Transferência') {
    if (!payload.origin) {
      alert('Selecciona o armazém de origem.');
      return;
    }

    if (!payload.destination) {
      alert('Selecciona o armazém de destino.');
      return;
    }

    if (payload.origin === payload.destination) {
      alert('Origem e destino não podem ser iguais numa transferência.');
      return;
    }
  }

  if (payload.type === 'Ajuste') {
    if (!payload.destination) {
      alert('Selecciona o armazém de destino do ajuste.');
      return;
    }

    payload.origin = '';
  }

  const mode = form.dataset.mode;
  const id = form.dataset.id;

  if (mode === 'edit' && id) {
    updateDocument(id, payload);
    window.location.hash = `#documents/view?id=${id}`;
    return;
  }

  const createdDocument = createDocument(payload);
  window.location.hash = `#documents/edit?id=${createdDocument.id}`;
}
