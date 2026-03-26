const state = {
  documents: [
    {
      id: crypto.randomUUID(),
      number: 'DOC-0001',
      date: '2026-03-25',
      type: 'Transferência',
      origin: 'Armazém Central',
      destination: 'Loja 1',
      status: 'draft',
      lines: [
        createDocumentLine({
          item: 'Produto A',
          quantity: 2,
          unitPrice: 1500,
        }),
        createDocumentLine({
          item: 'Produto B',
          quantity: 1,
          unitPrice: 2500,
        }),
      ],
      totals: {
        linesCount: 2,
        grandTotal: 5500,
      },
      postedAt: null,
      cancelledAt: null,
      cancelReason: '',
    },
    {
      id: crypto.randomUUID(),
      number: 'DOC-0002',
      date: '2026-03-24',
      type: 'Ajuste',
      origin: 'Armazém Central',
      destination: 'Stock Interno',
      status: 'posted',
      lines: [
        createDocumentLine({
          item: 'Produto C',
          quantity: 3,
          unitPrice: 900,
        }),
      ],
      totals: {
        linesCount: 1,
        grandTotal: 2700,
      },
      postedAt: '2026-03-24T10:30:00',
      cancelledAt: null,
      cancelReason: '',
    },
  ],
};

export function getState() {
  return state;
}

export function getDocuments() {
  return [...state.documents];
}

export function getDocumentById(id) {
  return state.documents.find((document) => document.id === id) || null;
}

export function createDocument(data) {
  const newDocument = {
    id: crypto.randomUUID(),
    number: generateDocumentNumber(),
    date: data.date,
    type: data.type,
    origin: data.origin,
    destination: data.destination,
    status: 'draft',
    lines: [],
    totals: {
      linesCount: 0,
      grandTotal: 0,
    },
    postedAt: null,
    cancelledAt: null,
    cancelReason: '',
  };

  state.documents.unshift(newDocument);
  return newDocument;
}

export function updateDocument(id, data) {
  const document = getDraftDocumentOrThrow(id);

  document.date = data.date;
  document.type = data.type;
  document.origin = data.origin;
  document.destination = data.destination;

  return document;
}

export function addDocumentLine(documentId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);

  const newLine = createDocumentLine({
    item: lineData.item,
    quantity: Number(lineData.quantity),
    unitPrice: Number(lineData.unitPrice),
  });

  document.lines.push(newLine);
  recalculateDocumentTotals(document);

  return newLine;
}

export function updateDocumentLine(documentId, lineId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);

  const line = document.lines.find((entry) => entry.id === lineId);

  if (!line) {
    throw new Error('Linha não encontrada.');
  }

  line.item = lineData.item;
  line.quantity = Number(lineData.quantity);
  line.unitPrice = Number(lineData.unitPrice);
  line.total = calculateLineTotal(line.quantity, line.unitPrice);

  recalculateDocumentTotals(document);

  return line;
}

export function removeDocumentLine(documentId, lineId) {
  const document = getDraftDocumentOrThrow(documentId);

  document.lines = document.lines.filter((entry) => entry.id !== lineId);
  recalculateDocumentTotals(document);
}

export function getDocumentLines(documentId) {
  const document = getDocumentById(documentId);

  if (!document) return [];

  return [...document.lines];
}

export function getDocumentTotals(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    return {
      linesCount: 0,
      grandTotal: 0,
    };
  }

  return { ...document.totals };
}

export function postDocument(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser postados.');
  }

  if (!document.lines.length) {
    throw new Error('Não é possível postar um documento sem linhas.');
  }

  document.status = 'posted';
  document.postedAt = new Date().toISOString();

  return document;
}

export function cancelDocument(documentId, reason = '') {
  const document = getDocumentById(documentId);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'posted') {
    throw new Error('Apenas documentos em posted podem ser cancelados.');
  }

  document.status = 'cancelled';
  document.cancelledAt = new Date().toISOString();
  document.cancelReason = reason?.trim() || 'Sem motivo informado.';

  return document;
}

function getDraftDocumentOrThrow(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser alterados.');
  }

  return document;
}

function createDocumentLine({ item, quantity, unitPrice }) {
  const safeQuantity = Number(quantity) || 0;
  const safeUnitPrice = Number(unitPrice) || 0;

  return {
    id: crypto.randomUUID(),
    item: item || '',
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    total: calculateLineTotal(safeQuantity, safeUnitPrice),
  };
}

function calculateLineTotal(quantity, unitPrice) {
  return Number(quantity) * Number(unitPrice);
}

function recalculateDocumentTotals(document) {
  const linesCount = document.lines.length;
  const grandTotal = document.lines.reduce((sum, line) => {
    return sum + Number(line.total || 0);
  }, 0);

  document.totals = {
    linesCount,
    grandTotal,
  };

  return document.totals;
}

function generateDocumentNumber() {
  const nextNumber = state.documents.length + 1;
  return `DOC-${String(nextNumber).padStart(4, '0')}`;
}
