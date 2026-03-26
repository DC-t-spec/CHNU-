import { cancelDocument } from '../../core/state.js';

export function handleDocumentCancel(documentId, options = {}) {
  const {
    redirectTo = 'detail',
    onSuccess = null,
  } = options;

  const reason = window.prompt('Informe o motivo do cancelamento:', '');

  if (reason === null) {
    return;
  }

  try {
    cancelDocument(documentId, reason);

    if (typeof onSuccess === 'function') {
      onSuccess();
      return;
    }

    if (redirectTo === 'list') {
      window.location.hash = window.location.hash || '#documents';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }

    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    window.alert(error.message || 'Não foi possível cancelar o documento.');
  }
}
