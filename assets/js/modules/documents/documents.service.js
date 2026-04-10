import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  postDocument,
  cancelDocument,
  addDocumentLine,
  updateDocumentLine,
  removeDocumentLine,
} from '../../core/state.js';

export function getDocumentsList(params = {}) {
  const {
    query = '',
    status = 'all',
    sortBy = 'dateDesc',
    page = 1,
    pageSize = 5,
  } = params;

  const allDocuments = getDocuments();

  let filtered = [...allDocuments];

  if (query && query.trim()) {
    const term = query.trim().toLowerCase();

    filtered = filtered.filter((doc) =>
      [
        doc.number,
        doc.type,
        doc.origin,
        doc.destination,
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
  const endIndex = startIndex + pageSize;

  const paginatedItems = filtered.slice(startIndex, endIndex);

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

  if (!doc) return null;

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
    case 'dateAsc':
      return sorted.sort(
        (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
      );

    case 'dateDesc':
      return sorted.sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );

    case 'numberAsc':
      return sorted.sort((a, b) =>
        String(a.number || '').localeCompare(String(b.number || ''))
      );

    case 'numberDesc':
      return sorted.sort((a, b) =>
        String(b.number || '').localeCompare(String(a.number || ''))
      );

    default:
      return sorted.sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
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
      return 'Postado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status || '-';
  }
}
export function addLineToDocument(documentId, payload) {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'draft') {
    throw new Error('Só é possível adicionar linhas em documentos draft.');
  }

  if (!payload?.product_id) {
    throw new Error('Produto inválido.');
  }

  if (!payload.item?.trim()) {
    throw new Error('Item inválido.');
  }

  if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) {
    throw new Error('Quantidade inválida.');
  }

  if (!Number.isFinite(Number(payload.unitPrice)) || Number(payload.unitPrice) < 0) {
    throw new Error('Preço unitário inválido.');
  }

  return addDocumentLine(documentId, {
    product_id: payload.product_id,
    item: payload.item.trim(),
    quantity: Number(payload.quantity),
    unitPrice: Number(payload.unitPrice),
  });
}

export function updateLineInDocument(documentId, lineId, payload) {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'draft') {
    throw new Error('Só é possível editar linhas em documentos draft.');
  }

  if (!lineId) {
    throw new Error('Linha inválida.');
  }

  if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) {
    throw new Error('Quantidade inválida.');
  }

  if (!Number.isFinite(Number(payload.unitPrice)) || Number(payload.unitPrice) < 0) {
    throw new Error('Preço unitário inválido.');
  }

  return updateDocumentLine(documentId, lineId, {
    ...payload,
    quantity: Number(payload.quantity),
    unitPrice: Number(payload.unitPrice),
  });
}

export function removeLineFromDocument(documentId, lineId) {
  const doc = getDocumentById(documentId);

  if (!doc) {
    throw new Error('Documento não encontrado.');
  }

  if (doc.status !== 'draft') {
    throw new Error('Só é possível remover linhas em documentos draft.');
  }

  if (!lineId) {
    throw new Error('Linha inválida.');
  }

  return removeDocumentLine(documentId, lineId);
}
