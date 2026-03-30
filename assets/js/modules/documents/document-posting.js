import { postDocument } from '../../core/state.js';
import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';

export async function handleDocumentPosting(documentId, options = {}) {
  const {
    redirectTo = 'detail',
    onSuccess = null,
  } = options;

  const confirmed = await showConfirm({
    title: 'Postar documento',
    message: 'Deseja postar este documento?',
    confirmText: 'Sim, postar',
    cancelText: 'Voltar',
  });

  if (!confirmed) return;

  try {
    postDocument(documentId);

    showToast({
      message: 'Documento postado com sucesso.',
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
      message: error.message || 'Erro ao postar documento.',
      type: 'error',
    });
  }
}
