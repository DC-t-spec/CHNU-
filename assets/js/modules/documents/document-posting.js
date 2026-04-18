// assets/js/modules/documents/document-posting.js

import {
  previewDocumentPosting,
  executeDocumentPosting,
} from '../../services/document-posting.service.js';

import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentPosting(documentId, options = {}) {
  if (!documentId) return false;

  const { redirectTo = 'detail' } = options;

  try {
    const preview = previewDocumentPosting(documentId);

    const confirmed = await showConfirm({
      title: 'Postar documento',
      message: `Este documento vai gerar ${preview.expectedMovements} movimento(s) de stock. Desejas continuar?`,
      confirmText: 'Postar',
      cancelText: 'Voltar',
      variant: 'success',
    });

    if (!confirmed) {
      return false;
    }

    const result = executeDocumentPosting(documentId);

    showToast(
      `Documento postado com sucesso. ${result.generatedMoves.length} movimento(s) gerado(s).`,
      'success'
    );

    if (redirectTo === 'list') {
      window.location.hash = '#documents';
      return true;
    }

    window.location.hash = `#documents/view?id=${documentId}`;
    return true;
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Erro ao postar documento.', 'error');
    return false;
  }
}
