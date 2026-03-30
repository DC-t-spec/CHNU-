export function showInputModal({
  title = 'Motivo',
  label = 'Motivo',
  placeholder = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
} = {}) {
  return new Promise((resolve) => {
    const overlay = window.document.createElement('div');
    overlay.className = 'ui-modal-overlay';

    overlay.innerHTML = `
      <div class="ui-modal">
        <div class="ui-modal-header">
          <h3>${title}</h3>
        </div>

        <div class="ui-modal-body">
          <label class="ui-label">${label}</label>
          <input type="text" class="ui-input" placeholder="${placeholder}" />
        </div>

        <div class="ui-modal-actions">
          <button class="btn btn-secondary" data-action="cancel">
            ${cancelText}
          </button>
          <button class="btn btn-primary" data-action="confirm">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    const input = overlay.querySelector('input');

    function close(value) {
      overlay.remove();
      resolve(value);
    }

overlay.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');

  // 👉 clicar fora do modal fecha
  if (!btn) {
    if (event.target === overlay) {
      close(null);
    }
    return;
  }

  if (btn.dataset.action === 'confirm') {
  close(input.value || '');
    return;
  }

  close(null);
});

    window.document.body.appendChild(overlay);

    input.focus();
  });
}
