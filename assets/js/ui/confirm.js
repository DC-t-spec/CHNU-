// assets/js/ui/confirm.js

let confirmRoot = null;

function ensureConfirmRoot() {
  if (confirmRoot) return confirmRoot;

  confirmRoot = document.createElement('div');
  confirmRoot.id = 'app-confirm-root';
  document.body.appendChild(confirmRoot);

  return confirmRoot;
}

export function showConfirm(input) {
  const config =
    typeof input === 'string'
      ? {
          title: 'Confirmar acção',
          message: input,
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          variant: 'primary',
        }
      : {
          title: input?.title || 'Confirmar acção',
          message: input?.message || 'Tens certeza que desejas continuar?',
          confirmText: input?.confirmText || 'Confirmar',
          cancelText: input?.cancelText || 'Cancelar',
          variant: input?.variant || 'primary',
        };

  return new Promise((resolve) => {
    const root = ensureConfirmRoot();

    root.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card modal-card--confirm">
          <div class="modal-header">
            <h3>${escapeHtml(config.title)}</h3>
          </div>

          <div class="modal-body">
            <p class="modal-text">${escapeHtml(config.message)}</p>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="confirm-cancel-btn">
              ${escapeHtml(config.cancelText)}
            </button>
            <button type="button" class="btn ${getConfirmButtonClass(config.variant)}" id="confirm-ok-btn">
              ${escapeHtml(config.confirmText)}
            </button>
          </div>
        </div>
      </div>
    `;

    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const okBtn = document.getElementById('confirm-ok-btn');
    const overlay = root.querySelector('.modal-overlay');

    function close(value) {
      root.innerHTML = '';
      resolve(value);
    }

    cancelBtn?.addEventListener('click', () => close(false));
    okBtn?.addEventListener('click', () => close(true));

    overlay?.addEventListener('click', (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });

    document.addEventListener('keydown', handleKeydown);

    function handleKeydown(event) {
      if (!root.innerHTML) {
        document.removeEventListener('keydown', handleKeydown);
        return;
      }

      if (event.key === 'Escape') {
        document.removeEventListener('keydown', handleKeydown);
        close(false);
      }

      if (event.key === 'Enter') {
        document.removeEventListener('keydown', handleKeydown);
        close(true);
      }
    }

    okBtn?.focus();
  });
}

function getConfirmButtonClass(variant) {
  if (variant === 'danger') return 'btn-danger';
  if (variant === 'success') return 'btn-success';
  return 'btn-primary';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
