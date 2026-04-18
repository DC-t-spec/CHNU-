import { getDocumentById } from './documents.service.js';

function getDocumentOrThrow(documentId) {
  if (!documentId) {
    throw new Error('Documento inválido.');
  }

  const documentData = getDocumentById(documentId);

  if (!documentData) {
    throw new Error('Documento não encontrado.');
  }

  return documentData;
}

export function assertEditableDocument(documentId) {
  const documentData = getDocumentOrThrow(documentId);

  if (documentData.status === 'posted') {
    throw new Error('Documentos lançados não podem ser editados.');
  }

  if (documentData.status === 'cancelled') {
    throw new Error('Documentos cancelados não podem ser editados.');
  }

  return true;
}

export function assertPostedDocument(documentId) {
  const documentData = getDocumentOrThrow(documentId);

  if (documentData.status !== 'posted') {
    throw new Error('A operação exige um documento lançado.');
  }

  return true;
}

export function assertDraftDocument(documentId) {
  const documentData = getDocumentOrThrow(documentId);

  if (documentData.status !== 'draft') {
    throw new Error('A operação exige um documento em rascunho.');
  }

  return true;
}

export function canEditDocument(documentId) {
  try {
    assertEditableDocument(documentId);
    return true;
  } catch {
    return false;
  }
}

export function canPostDocument(documentId) {
  try {
    assertDraftDocument(documentId);
    return true;
  } catch {
    return false;
  }
}

export function canCancelDocument(documentId) {
  try {
    assertPostedDocument(documentId);
    return true;
  } catch {
    return false;
  }
}
