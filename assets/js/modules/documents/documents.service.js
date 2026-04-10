import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  postDocument,
  cancelDocument,
} from '../../core/state.js';

export function getDocumentsList(params = {}) {
  const {
    query = '',
    status = 'all',
    sortBy = 'documentDateDesc',
    page = 1,
    pageSize = 10,
  } = params;

  const allDocuments = getDocuments();

  let filtered = [...allDocuments];

  if (query && query.trim()) {
    const term = query.trim().toLowerCase();

    filtered = filtered.filter((doc) =>
      [
        doc.number,
        doc.typeLabel,
        doc.sourceLabel,
        doc.destinationLabel,
        doc.reference,
        doc.notes,
        doc.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }

  if (status !== 'all') {
    filtered = filtered.filter((doc) => doc.status === status);
  }

  filtered = sortDocuments(filtered, sortBy);

  const summaries = buildDocumentsSummaries(allDocuments, filtered);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems.map(mapDocumentListItem),
    summaries,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
    filters: {
      query,
      status,
      sortBy,
    },
  };
}

export function getDocumentDetails(documentId) {
  const doc = getDocumentById(documentId);

  if (!doc) {
    return null;
  }

  return {
    ...doc,
    statusLabel: getStatusLabel(doc.status),
    canEdit: doc.status === 'draft',
    canPost: doc.status === 'draft',
    canCancel: doc.status === 'posted',
  };
}

export function getDocumentForEditing(documentId) {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser editados.');
  }

  return doc;
}

export function saveDocument(payload) {
  if (payload.id) {
    return updateDocument(payload.id, payload);
  }

  return createDocument(payload);
}

export function executeDocumentPosting(documentId, userId = 'system') {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser lançados.');
  }

  return postDocument(documentId, userId);
}

export function executeDocumentCancel(documentId, reason, userId = 'system') {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'posted') {
    throw new Error('Apenas documentos lançados podem ser cancelados.');
  }

  if (!reason || !reason.trim()) {
    throw new Error('O motivo do cancelamento é obrigatório.');
  }

  return cancelDocument(documentId, reason.trim(), userId);
}

function sortDocuments(documents, sortBy) {
  const sorted = [...documents];

  switch (sortBy) {
    case 'numberAsc':
      return sorted.sort((a, b) =>
        String(a.number || '').localeCompare(String(b.number || ''))
      );

    case 'numberDesc':
      return sorted.sort((a, b) =>
        String(b.number || '').localeCompare(String(a.number || ''))
      );

    case 'dateAsc':
      return sorted.sort(
        (a, b) => new Date(a.documentDate || 0) - new Date(b.documentDate || 0)
      );

    case 'dateDesc':
    case 'documentDateDesc':
      return sorted.sort(
        (a, b) => new Date(b.documentDate || 0) - new Date(a.documentDate || 0)
      );

    case 'statusAsc':
      return sorted.sort((a, b) =>
        String(a.status || '').localeCompare(String(b.status || ''))
      );

    case 'totalAsc':
      return sorted.sort(
        (a, b) => Number(a.grandTotal || 0) - Number(b.grandTotal || 0)
      );

    case 'totalDesc':
      return sorted.sort(
        (a, b) => Number(b.grandTotal || 0) - Number(a.grandTotal || 0)
      );

    default:
      return sorted.sort(
        (a, b) => new Date(b.documentDate || 0) - new Date(a.documentDate || 0)
      );
  }
}

function buildDocumentsSummaries(allDocuments, filteredDocuments) {
  return {
    total: allDocuments.length,
    draft: allDocuments.filter((doc) => doc.status === 'draft').length,
    posted: allDocuments.filter((doc) => doc.status === 'posted').length,
    cancelled: allDocuments.filter((doc) => doc.status === 'cancelled').length,
    filteredTotal: filteredDocuments.length,
  };
}

function mapDocumentListItem(doc) {
  return {
    ...doc,
    statusLabel: getStatusLabel(doc.status),
    canEdit: doc.status === 'draft',
    canPost: doc.status === 'draft',
    canCancel: doc.status === 'posted',
  };
}

function getStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'posted':
      return 'Lançado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status || '-';
  }
}
