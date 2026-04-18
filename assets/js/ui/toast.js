// assets/js/ui/toast.js

let toastRoot = null;
let toastTimer = null;

function ensureToastRoot() {
  if (toastRoot) return toastRoot;

  toastRoot = document.createElement('div');
  toastRoot.id = 'app-toast-root';
  toastRoot.style.position = 'fixed';
  toastRoot.style.top = '20px';
  toastRoot.style.right = '20px';
  toastRoot.style.zIndex = '9999';
  toastRoot.style.display = 'flex';
  toastRoot.style.flexDirection = 'column';
  toastRoot.style.gap = '12px';

  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function showToast(message, variant = 'success') {
  const root = ensureToastRoot();

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  root.innerHTML = `
    <div class="app-toast app-toast--${escapeHtml(variant)}" id="app-toast-item" style="
      min-width: 280px;
      max-width: 420px;
      padding: 14px 16px;
      border-radius: 14px;
      box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
      font-size: 14px;
      font-weight: 700;
      line-height: 1.45;
      border: 1px solid ${getBorderColor(variant)};
      background: ${getBackgroundColor(variant)};
      color: ${getTextColor(variant)};
    ">
      ${escapeHtml(message)}
    </div>
  `;

  toastTimer = setTimeout(() => {
    root.innerHTML = '';
    toastTimer = null;
  }, 2600);
}

function getBackgroundColor(variant) {
  if (variant === 'error') return '#fee2e2';
  if (variant === 'warning') return '#fef3c7';
  if (variant === 'info') return '#dbeafe';
  return '#dcfce7';
}

function getBorderColor(variant) {
  if (variant === 'error') return '#fecaca';
  if (variant === 'warning') return '#fde68a';
  if (variant === 'info') return '#bfdbfe';
  return '#bbf7d0';
}

function getTextColor(variant) {
  if (variant === 'error') return '#991b1b';
  if (variant === 'warning') return '#92400e';
  if (variant === 'info') return '#1d4ed8';
  return '#166534';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
