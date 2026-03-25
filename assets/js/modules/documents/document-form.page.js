import {
  getDocumentById,
  createDocument,
  updateDocument,
} from '../../core/state.js';

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
              <input id="type" name="type" type="text" value="${documentData.type}" required />
            </div>

            <div class="form-field">
              <label for="origin">Origem</label>
              <input id="origin" name="origin" type="text" value="${documentData.origin}" required />
            </div>

            <div class="form-field">
              <label for="destination">Destino</label>
              <input id="destination" name="destination" type="text" value="${documentData.destination}" required />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${isEditMode ? 'Guardar alterações' : 'Criar documento'}
            </button>
          </div>
        </form>
      </div>
    </section>
  `;

  bindDocumentForm();
}

function bindDocumentForm() {
  const form = document.querySelector('#document-form');

  if (!form) return;

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

  const mode = form.dataset.mode;
  const id = form.dataset.id;

  if (mode === 'edit' && id) {
    updateDocument(id, payload);
    window.location.hash = `#documents/view?id=${id}`;
    return;
  }

  const createdDocument = createDocument(payload);
  window.location.hash = `#documents/view?id=${createdDocument.id}`;
}
