import { cancelDocument } from '../../core/state.js';

export function handleDocumentCancel(documentId) {
  const reason = window.prompt('Informe o motivo do cancelamento:', '');

  if (reason === null) {
    return;
  }

  try {
    cancelDocument(documentId, reason);
    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    window.alert(error.message || 'Não foi possível cancelar o documento.');
  }
}
