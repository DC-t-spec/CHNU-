

let modalRoot = null;

function ensureModalRoot() {
  if (modalRoot) return modalRoot;

  modalRoot = document.createElement('div');
  modalRoot.id = 'app-modal-root';
  document.body.appendChild(modalRoot);

  return modalRoot;
}

export function showInputModal({
  title = 'Input',
  label = 'Valor',
  placeholder = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  required = false,
  minLength = 0,
} = {}) {
  return new Promise((resolve) => {
    const root = ensureModalRoot();

    root.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>${escapeHtml(title)}</h3>
          </div>

          <div class="modal-body">
            <label class="modal-label">${escapeHtml(label)}</label>
            <input
              type="text"
              class="modal-input"
              placeholder="${escapeHtml(placeholder)}"
              id="modal-input-field"
            />
            <span class="modal-error" id="modal-error" style="display:none;"></span>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" id="modal-cancel">
              ${escapeHtml(cancelText)}
            </button>
            <button class="btn btn-danger" id="modal-confirm">
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById('modal-input-field');
    const errorEl = document.getElementById('modal-error');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    input.focus();

    function close(value) {
      root.innerHTML = '';
      resolve(value);
    }

    cancelBtn.onclick = () => close(null);

    confirmBtn.onclick = () => {
      const value = input.value.trim();

      if (required && !value) {
        showError('Campo obrigatório.');
        return;
      }

      if (minLength && value.length < minLength) {
        showError(`Mínimo de ${minLength} caracteres.`);
        return;
      }

      close(value);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      }
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });

    function showError(message) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
