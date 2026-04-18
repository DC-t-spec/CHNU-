// assets/js/modules/documents/document-posting.js

import { postDocumentService } from '../../services/documents.service.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentPosting(documentId, options = {}) {
  const { redirectTo = 'detail' } = options;

  const confirmed = await showConfirm('Deseja postar este documento?');
  if (!confirmed) return false;

  await postDocumentService(documentId);
  showToast('Documento postado com sucesso.');

  if (redirectTo === 'list') {
    window.location.hash = '#documents';
    return true;
  }

  window.location.hash = `#documents/view?id=${documentId}`;
  return true;
}
