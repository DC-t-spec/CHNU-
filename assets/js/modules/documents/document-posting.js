import { postDocument } from '../../core/state.js';

export function handleDocumentPosting(documentId) {
  try {
    postDocument(documentId);
    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    window.alert(error.message || 'Não foi possível postar o documento.');
  }
}
