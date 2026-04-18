import { showConfirm } from '../../ui/confirm.js';
import { showToast } from '../../ui/toast.js';
import { postDocumentById } from '../../services/documents.service.js';

export async function handleDocumentPosting(documentId) {
  if (!documentId) {
    showToast({
      type: 'error',
      message: 'Documento inválido.',
    });
    return;
  }

  const confirmed = await showConfirm({
    title: 'Lançar documento',
    message: 'Queres lançar este documento agora? Depois disso deixará de ser editável.',
    confirmText: 'Lançar',
    cancelText: 'Voltar',
    tone: 'primary',
  });

  if (!confirmed) return;

  try {
    await postDocumentById(documentId);

    showToast({
      type: 'success',
      message: 'Documento lançado com sucesso.',
    });

    window.location.hash = `#documents/view?id=${documentId}`;
  } catch (error) {
    showToast({
      type: 'error',
      message: error?.message || 'Falha ao lançar documento.',
    });
  }
}
