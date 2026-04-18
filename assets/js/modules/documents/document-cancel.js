// assets/js/modules/documents/document-cancel.js

import { cancelDocument } from '../../services/documents.service.js';
import { showConfirm } from '../../components/confirm.js';
import { showToast } from '../../components/toast.js';
import { showInputModal } from '../../components/modal.js';

export async function handleDocumentCancel(documentId, options = {}) {
  if (!documentId) return;

  const confirmed = await showConfirm({
    title: 'Cancelar documento',
    message: 'Tens certeza que desejas cancelar este documento?',
    confirmText: 'Sim, cancelar',
    cancelText: 'Voltar',
    variant: 'danger',
  });

  if (!confirmed) return;

  const reason = await showInputModal({
    title: 'Motivo do cancelamento',
    label: 'Informe o motivo',
    placeholder: 'Ex: erro de lançamento, duplicado...',
    confirmText: 'Confirmar cancelamento',
    cancelText: 'Voltar',
    required: true,
    minLength: 3,
  });

  if (!reason) {
    showToast('Cancelamento abortado: motivo não informado.', 'warning');
    return;
  }

  try {
    await cancelDocument(documentId, reason);

    showToast('Documento cancelado com sucesso.', 'success');

    if (options.redirectTo === 'list') {
      window.location.hash = '#documents';
      return;
    }

    if (options.redirectTo === 'detail') {
      window.location.hash = `#documents/view?id=${documentId}`;
      return;
    }
  } catch (error) {
    console.error(error);
    showToast('Erro ao cancelar documento.', 'error');
  }
}
