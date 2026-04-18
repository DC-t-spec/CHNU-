// assets/js/services/document-posting.service.js

import {
  getDocumentService,
  postDocumentService,
} from './documents.service.js';

import {
  getStockMoves,
  getStockBalances,
} from '../core/state.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function indexBalances(list = []) {
  const map = new Map();

  list.forEach((row) => {
    const key = `${row.product_id}::${row.warehouse_id}`;
    map.set(key, {
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      qty_on_hand: Number(row.qty_on_hand || 0),
      qty_reserved: Number(row.qty_reserved || 0),
      qty_available: Number(row.qty_available || 0),
      avg_unit_cost: Number(row.avg_unit_cost || 0),
      total_cost: Number(row.total_cost || 0),
    });
  });

  return map;
}

function diffBalances(beforeList = [], afterList = []) {
  const before = indexBalances(beforeList);
  const after = indexBalances(afterList);
  const keys = new Set([...before.keys(), ...after.keys()]);

  return [...keys]
    .map((key) => {
      const prev = before.get(key) || {
        product_id: key.split('::')[0],
        warehouse_id: key.split('::')[1],
        qty_on_hand: 0,
        qty_reserved: 0,
        qty_available: 0,
        avg_unit_cost: 0,
        total_cost: 0,
      };

      const next = after.get(key) || {
        product_id: key.split('::')[0],
        warehouse_id: key.split('::')[1],
        qty_on_hand: 0,
        qty_reserved: 0,
        qty_available: 0,
        avg_unit_cost: 0,
        total_cost: 0,
      };

      const changed =
        prev.qty_on_hand !== next.qty_on_hand ||
        prev.qty_reserved !== next.qty_reserved ||
        prev.qty_available !== next.qty_available ||
        prev.avg_unit_cost !== next.avg_unit_cost ||
        prev.total_cost !== next.total_cost;

      if (!changed) return null;

      return {
        product_id: next.product_id,
        warehouse_id: next.warehouse_id,
        before: prev,
        after: next,
      };
    })
    .filter(Boolean);
}

function getNewMoves(beforeMoves = [], afterMoves = [], documentId) {
  const beforeIds = new Set(beforeMoves.map((move) => move.id));

  return afterMoves.filter((move) => {
    if (beforeIds.has(move.id)) return false;
    return move.reference_document_id === documentId;
  });
}

export function previewDocumentPosting(documentId) {
  const documentData = getDocumentService(documentId);

  if (!documentData) {
    throw new Error('Documento não encontrado.');
  }

  if (documentData.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser postados.');
  }

  return {
    document: documentData,
    expectedMovements: (documentData.lines || []).length * (
      documentData.type === 'Transferência' ? 2 : 1
    ),
    linesCount: Number(documentData.linesCount || 0),
    grandTotal: Number(documentData.grandTotal || 0),
  };
}

export function executeDocumentPosting(documentId) {
  const beforeMoves = clone(getStockMoves() || []);
  const beforeBalances = clone(getStockBalances() || []);

  const postedDocument = postDocumentService(documentId);

  const afterMoves = clone(getStockMoves() || []);
  const afterBalances = clone(getStockBalances() || []);

  return {
    document: postedDocument,
    generatedMoves: getNewMoves(beforeMoves, afterMoves, documentId),
    balanceChanges: diffBalances(beforeBalances, afterBalances),
  };
}
