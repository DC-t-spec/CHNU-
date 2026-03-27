export function showToast({
  message = '',
  type = 'info',
  duration = 2500,
} = {}) {
  const containerId = 'ui-toast-container';
  let container = window.document.querySelector(`#${containerId}`);

  if (!container) {
    container = window.document.createElement('div');
    container.id = containerId;
    container.className = 'ui-toast-container';
    window.document.body.appendChild(container);
  }

  const toast = window.document.createElement('div');
  toast.className = `ui-toast ui-toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('is-hiding');

    window.setTimeout(() => {
      toast.remove();

      if (!container.children.length) {
        container.remove();
      }
    }, 300);
  }, duration);
}
