// assets/js/modules/documents/document-posting.js

import { postDocumentService } from '../../services/documents.service.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentPosting(documentId, options = {}) {
  if (!documentId) return false;

  const { redirectTo = 'detail' } = options;

  const confirmed = await showConfirm(
    'Tens certeza que desejas postar este documento? Esta acção irá gerar movimentos de stock.'
  );

  if (!confirmed) {
    return false;
  }

  try {
    postDocumentService(documentId);

    showToast('Documento postado com sucesso.');

    if (redirectTo === 'list') {
      window.location.hash = '#documents';
      return true;
    }

    window.location.hash = `#documents/view?id=${documentId}`;
    return true;
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Erro ao postar documento.');
    return false;
  }
}
