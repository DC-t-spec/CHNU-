// assets/js/modules/documents/document-cancel.js

import { cancelDocumentService } from '../../services/documents.service.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';
import { showInputModal } from '../../ui/modal.js';

export async function handleDocumentCancel(documentId, options = {}) {
  if (!documentId) return false;

  const { redirectTo = 'detail' } = options;

  const confirmed = await showConfirm({
    title: 'Cancelar documento',
    message: 'Tens certeza que desejas cancelar este documento? Esta acção irá gerar reversão de movimentos de stock.',
    confirmText: 'Continuar',
    cancelText: 'Voltar',
    variant: 'danger',
  });

  if (!confirmed) {
    return false;
  }

  const reason = await showInputModal({
    title: 'Motivo do cancelamento',
    label: 'Informe o motivo',
    placeholder: 'Ex: erro de lançamento, documento duplicado...',
    confirmText: 'Confirmar cancelamento',
    cancelText: 'Fechar',
    required: true,
    minLength: 3,
  });

  if (!reason) {
    showToast('Cancelamento abortado. Motivo não informado.', 'warning');
    return false;
  }

  try {
    cancelDocumentService(documentId, reason);

    showToast('Documento cancelado com sucesso.', 'success');

    if (redirectTo === 'list') {
      window.location.hash = '#documents';
      return true;
    }

    window.location.hash = `#documents/view?id=${documentId}`;
    return true;
  } catch (error) {
    console.error(error);
    showToast(error?.message || 'Erro ao cancelar documento.', 'error');
    return false;
  }
}
