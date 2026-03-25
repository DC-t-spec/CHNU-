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
    },
    {
      id: crypto.randomUUID(),
      number: 'DOC-0002',
      date: '2026-03-24',
      type: 'Ajuste',
      origin: 'Armazém Central',
      destination: 'Stock Interno',
      status: 'posted',
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
  };

  state.documents.unshift(newDocument);
  return newDocument;
}

export function updateDocument(id, data) {
  const document = getDocumentById(id);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser editados.');
  }

  document.date = data.date;
  document.type = data.type;
  document.origin = data.origin;
  document.destination = data.destination;

  return document;
}

function generateDocumentNumber() {
  const nextNumber = state.documents.length + 1;
  return `DOC-${String(nextNumber).padStart(4, '0')}`;
}
