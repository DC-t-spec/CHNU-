// assets/js/services/documents.service.js

import {
  searchDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  postDocument,
  cancelDocument,
} from '../core/state.js';

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeDocument(doc) {
  return {
    ...doc,
    grandTotal: doc.grandTotal ?? doc.total ?? 0,
    linesCount: doc.lines?.length || 0,
  };
}

/* =========================================================
   FILTERS
========================================================= */

function applyFilters(list, filters = {}) {
  let result = [...list];

  if (filters.query) {
    const q = filters.query.toLowerCase();

    result = result.filter((doc) =>
      [doc.number, doc.type, doc.origin, doc.destination]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((d) => d.status === filters.status);
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter((d) => d.type === filters.type);
  }

  if (filters.dateFrom) {
    result = result.filter((d) => new Date(d.date) >= new Date(filters.dateFrom));
  }

  if (filters.dateTo) {
    result = result.filter((d) => new Date(d.date) <= new Date(filters.dateTo));
  }

  return result;
}

/* =========================================================
   SORT
========================================================= */

function applySort(list, sort = {}) {
  const { field = 'date', direction = 'desc' } = sort;

  return [...list].sort((a, b) => {
    let A = a[field];
    let B = b[field];

    if (field === 'date') {
      A = new Date(A);
      B = new Date(B);
    }

    if (A < B) return direction === 'asc' ? -1 : 1;
    if (A > B) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/* =========================================================
   PAGINATION
========================================================= */

function applyPagination(list, pagination = {}) {
  const page = Number(pagination.page || 1);
  const pageSize = Number(pagination.pageSize || 10);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: list.slice(start, end),
    meta: {
      total,
      totalPages,
      page,
      pageSize,
    },
  };
}

/* =========================================================
   SUMMARY
========================================================= */

function buildSummary(list) {
  return {
    total: list.length,
    draft: list.filter((d) => d.status === 'draft').length,
    posted: list.filter((d) => d.status === 'posted').length,
    cancelled: list.filter((d) => d.status === 'cancelled').length,
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

export function listDocuments(options = {}) {
  const {
    filters = {},
    sort = { field: 'date', direction: 'desc' },
    pagination = { page: 1, pageSize: 10 },
  } = options;

  const raw = searchDocuments({});
  const normalized = raw.map(normalizeDocument);

  const filtered = applyFilters(normalized, filters);
  const sorted = applySort(filtered, sort);
  const paginated = applyPagination(sorted, pagination);

  const summary = buildSummary(normalized);

  return {
    data: paginated.data,
    meta: paginated.meta,
    summary,
  };
}

export function getDocument(documentId) {
  const doc = getDocumentById(documentId);
  if (!doc) return null;

  return normalizeDocument(doc);
}

export function createNewDocument(payload) {
  return createDocument({
    ...payload,
    status: 'draft',
    lines: payload.lines || [],
  });
}

export function updateExistingDocument(documentId, payload) {
  return updateDocument(documentId, payload);
}

export function removeDocument(documentId) {
  return deleteDocument(documentId);
}

export async function postDocumentService(documentId, userId = null) {
  return await postDocument(documentId, userId);
}

export async function cancelDocumentService(documentId, userId = null, reason = '') {
  return await cancelDocument(documentId, userId, reason);
}
