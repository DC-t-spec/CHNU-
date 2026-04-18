// assets/js/modules/documents/document-cancel.js

import { cancelDocumentService } from '../../services/documents.service.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentCancel(documentId, options = {}) {
  const { redirectTo = 'detail', reason = 'Cancelado pelo utilizador' } = options;

  const confirmed = await showConfirm('Deseja cancelar este documento?');
  if (!confirmed) return false;

  await cancelDocumentService(documentId, null, reason);
  showToast('Documento cancelado com sucesso.');

  if (redirectTo === 'list') {
    window.location.hash = '#documents';
    return true;
  }

  window.location.hash = `#documents/view?id=${documentId}`;
  return true;
}
