import assert from 'node:assert/strict';
import {
  saveDocument,
  postDocumentById,
  cancelDocumentById,
  getDocumentById,
  listDocuments,
} from '../assets/js/services/documents.service.js';
import { getInventoryBalances, getInventoryLedger } from '../assets/js/services/inventory.service.js';

function expectThrows(label, fn, pattern) {
  let thrown = null;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown, `${label}: devia lançar erro`);
  if (pattern) {
    assert.match(String(thrown.message || thrown), pattern, `${label}: mensagem inesperada`);
  }
}

function findBalance(productId, warehouseId) {
  return getInventoryBalances().find((row) => row.product_id === productId && row.warehouse_id === warehouseId) || null;
}

function countLedgerMoves(documentId) {
  return getInventoryLedger().filter((row) => row.reference_document_id === documentId).length;
}

function run() {
  const baseBalance = findBalance('p1', 'w1');
  assert.ok(baseBalance, 'balance base p1/w1 não encontrado');
  const baseAvailable = Number(baseBalance.qty_available || 0);

  // 1) criar sale draft
  const saleDraft = saveDocument({
    type: 'sale',
    date: '2026-04-20',
    customer_id: 'c1',
    origin: 'w1',
    notes: 'Draft inicial',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1500 }],
  });
  assert.equal(saleDraft.type, 'sale');
  assert.equal(saleDraft.status, 'draft');

  // 2) editar sale draft
  const saleEdited = saveDocument({
    id: saleDraft.id,
    type: 'sale',
    date: '2026-04-21',
    customer_id: 'c2',
    origin: 'w1',
    notes: 'Draft editado',
    lines: [{ product_id: 'p1', quantity: 2, unitPrice: 1500 }],
  });
  assert.equal(saleEdited.customer_id, 'c2');
  assert.equal(saleEdited.linesCount, 1);
  assert.equal(Number(saleEdited.lines[0].qty), 2);

  // 3) cliente obrigatório
  expectThrows('cliente obrigatório', () => saveDocument({
    type: 'sale',
    date: '2026-04-20',
    origin: 'w1',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1500 }],
  }), /Cliente obrigatório/i);

  // 4) origem obrigatória
  expectThrows('origem obrigatória', () => saveDocument({
    type: 'sale',
    date: '2026-04-20',
    customer_id: 'c1',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1500 }],
  }), /Origem obrigatória/i);

  // 5) qty > 0
  expectThrows('qty > 0', () => saveDocument({
    type: 'sale',
    date: '2026-04-20',
    customer_id: 'c1',
    origin: 'w1',
    lines: [{ product_id: 'p1', quantity: 0, unitPrice: 1500 }],
  }), /qty > 0/i);

  // 6) impedir post sem linhas
  const saleNoLines = saveDocument({
    type: 'sale',
    date: '2026-04-20',
    customer_id: 'c1',
    origin: 'w1',
    lines: [],
  });
  expectThrows('post sem linhas', () => postDocumentById(saleNoLines.id), /1 linha|sem linhas/i);

  // 7) impedir post sem stock suficiente
  const saleNoStock = saveDocument({
    type: 'sale',
    date: '2026-04-20',
    customer_id: 'c1',
    origin: 'w1',
    lines: [{ product_id: 'p1', quantity: baseAvailable + 999, unitPrice: 1500 }],
  });
  expectThrows('post sem stock', () => postDocumentById(saleNoStock.id), /Stock insuficiente/i);

  // 8) post sale
  const beforePostMoves = countLedgerMoves(saleEdited.id);
  const posted = postDocumentById(saleEdited.id);
  assert.equal(posted.status, 'posted');

  // 9) reflexo coerente inventory/ledger
  const afterPostBalance = findBalance('p1', 'w1');
  const afterPostAvailable = Number(afterPostBalance.qty_available || 0);
  assert.equal(afterPostAvailable, baseAvailable - 2, 'saldo disponível deve reduzir em 2');

  const ledgerAfterPost = getInventoryLedger().filter((row) => row.reference_document_id === saleEdited.id);
  assert.equal(ledgerAfterPost.length, beforePostMoves + 1);
  assert.ok(ledgerAfterPost.some((row) => row.direction === 'out' && row.movement_type === 'sale_out' && Number(row.qty) === 2));

  // 10) garantir posted não editável
  expectThrows('posted não editável', () => saveDocument({
    id: saleEdited.id,
    type: 'sale',
    date: '2026-04-22',
    customer_id: 'c2',
    origin: 'w1',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1500 }],
  }), /posted não pode ser editado/i);

  // 11) cancel sale
  const cancelled = cancelDocumentById(saleEdited.id, 'Hardening cancel');
  assert.equal(cancelled.status, 'cancelled');

  // 12) reversão coerente
  const afterCancelBalance = findBalance('p1', 'w1');
  const afterCancelAvailable = Number(afterCancelBalance.qty_available || 0);
  assert.equal(afterCancelAvailable, baseAvailable, 'saldo deve voltar ao valor original');

  const ledgerAfterCancel = getInventoryLedger().filter((row) => row.reference_document_id === saleEdited.id);
  assert.ok(ledgerAfterCancel.some((row) => row.direction === 'in' && row.movement_type === 'sale_reversal_in' && Number(row.qty) === 2));

  // 13) cancelled não postável novamente
  expectThrows('cancelled não postável', () => postDocumentById(saleEdited.id), /cancelled não pode ser postado/i);

  const current = getDocumentById(saleEdited.id);
  assert.equal(current.status, 'cancelled');

  // sanity: sale docs exist
  assert.ok(listDocuments({}).some((doc) => doc.type === 'sale'), 'vendas não encontradas');

  console.log('SALES HARDENING OK');
}

run();
