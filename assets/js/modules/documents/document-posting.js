import { postDocument } from '../../core/state.js';

export function handleDocumentPosting(documentId, options = {}) {
  const {
    redirectTo = 'detail',
    onSuccess = null,
  } = options;

  try {
    postDocument(documentId);

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
    window.alert(error.message || 'Não foi possível postar o documento.');
  }
}
