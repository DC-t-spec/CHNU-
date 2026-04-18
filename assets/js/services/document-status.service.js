// assets/js/services/document-status.service.js

import { getDocumentService } from './documents.service.js';

export function canEditDocument(documentId) {
  const doc = getDocumentService(documentId);
  if (!doc) return false;

  return doc.status === 'draft';
}

export function assertEditable(documentId) {
  const doc = getDocumentService(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado');
  }

  if (doc.status !== 'draft') {
    throw new Error('Documento não pode ser editado (não está em draft)');
  }

  return true;
}
