export function showConfirm({
  title = 'Confirmar acção',
  message = 'Tem certeza?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
} = {}) {
  return new Promise((resolve) => {
    const overlay = window.document.createElement('div');
    overlay.className = 'ui-confirm-overlay';
    overlay.innerHTML = `
      <div class="ui-confirm-dialog">
        <div class="ui-confirm-header">
          <h3>${title}</h3>
        </div>
        <div class="ui-confirm-body">
          <p>${message}</p>
        </div>
        <div class="ui-confirm-actions">
          <button type="button" class="btn btn-secondary" data-confirm-action="cancel">
            ${cancelText}
          </button>
          <button type="button" class="btn btn-primary" data-confirm-action="confirm">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    function close(result) {
      overlay.remove();
      resolve(result);
    }

    overlay.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-confirm-action]');
      if (!actionButton) {
        if (event.target === overlay) {
          close(false);
        }
        return;
      }

      const action = actionButton.dataset.confirmAction;

      if (action === 'confirm') {
        close(true);
        return;
      }

      close(false);
    });

    window.document.body.appendChild(overlay);
  });
}
