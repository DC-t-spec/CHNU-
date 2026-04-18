import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';
import { cancelDocumentById } from '../../services/documents.service.js';

export async function handleDocumentCancel(documentId) {
  if (!documentId) {
    showToast({
      type: 'error',
      message: 'Documento inválido.',
    });
    return;
  }

  const reason = window.prompt('Motivo do cancelamento:')?.trim();

  if (!reason) {
    showToast({
      type: 'error',
      message: 'Indica o motivo do cancelamento.',
    });
    return;
  }

  const confirmed = await showConfirm({
    title: 'Cancelar documento',
    message: 'Queres mesmo cancelar este documento? Esta acção não deve ser usada sem motivo válido.',
    confirmText: 'Cancelar documento',
    cancelText: 'Voltar',
    tone: 'danger',
  });

  if (!confirmed) return;

  try {
    await cancelDocumentById(documentId, reason);

    showToast({
      type: 'success',
      message: 'Documento cancelado com sucesso.',
    });

    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    showToast({
      type: 'error',
      message: error?.message || 'Falha ao cancelar documento.',
    });
  }
}
