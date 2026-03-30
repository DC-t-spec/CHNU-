import { cancelDocument } from '../../core/state.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentCancel(documentId, options = {}) {
  const {
    redirectTo = 'detail',
    onSuccess = null,
  } = options;

  const confirmed = await showConfirm({
    title: 'Cancelar documento',
    message: 'Deseja cancelar este documento?',
    confirmText: 'Sim, continuar',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  // 👉 TEMPORÁRIO: ainda usamos prompt só para não quebrar fluxo
  const reason = window.prompt('Motivo do cancelamento:', '');

  if (reason === null) return;

  if (!reason.trim()) {
    showToast({
      message: 'Motivo é obrigatório.',
      type: 'error',
    });
    return;
  }

  try {
    cancelDocument(documentId, reason);

    showToast({
      message: 'Documento cancelado com sucesso.',
      type: 'success',
    });

    if (typeof onSuccess === 'function') {
      onSuccess();
      return;
    }

    if (redirectTo === 'list') {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }

    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    showToast({
      message: error.message || 'Erro ao cancelar documento.',
      type: 'error',
    });
  }
}
