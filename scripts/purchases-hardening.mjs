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
  const baseBalance = findBalance('p1', 'w3');
  const baseAvailable = Number(baseBalance?.qty_available || 0);

  // 1) criar purchase draft
  const purchaseDraft = saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's1',
    destination: 'w3',
    notes: 'Draft inicial compra',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1200 }],
  });
  assert.equal(purchaseDraft.type, 'purchase');
  assert.equal(purchaseDraft.status, 'draft');

  // 2) editar purchase draft
  const purchaseEdited = saveDocument({
    id: purchaseDraft.id,
    type: 'purchase',
    date: '2026-04-21',
    supplier_id: 's2',
    destination: 'w3',
    notes: 'Draft editado compra',
    lines: [{ product_id: 'p1', quantity: 2, unitPrice: 1300 }],
  });
  assert.equal(purchaseEdited.supplier_id, 's2');
  assert.equal(purchaseEdited.linesCount, 1);
  assert.equal(Number(purchaseEdited.lines[0].qty), 2);

  // 3) fornecedor obrigatório
  expectThrows('fornecedor obrigatório', () => saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1200 }],
  }), /Fornecedor obrigatório/i);

  // 4) destino obrigatório
  expectThrows('destino obrigatório', () => saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's1',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1200 }],
  }), /Destino obrigatório/i);

  // 4.1) fornecedor deve existir no state
  expectThrows('fornecedor inválido', () => saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's999',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1200 }],
  }), /Fornecedor inválido/i);

  // 5) qty > 0
  expectThrows('qty > 0', () => saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's1',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 0, unitPrice: 1200 }],
  }), /qty > 0/i);

  // 6) unit_cost > 0
  expectThrows('unit_cost > 0', () => saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's1',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 0 }],
  }), /unit_cost > 0/i);

  // 7) impedir post sem linhas
  const purchaseNoLines = saveDocument({
    type: 'purchase',
    date: '2026-04-20',
    supplier_id: 's1',
    destination: 'w3',
    lines: [],
  });
  expectThrows('post sem linhas', () => postDocumentById(purchaseNoLines.id), /1 linha|sem linhas/i);

  // 8) post purchase
  const beforePostMoves = countLedgerMoves(purchaseEdited.id);
  const posted = postDocumentById(purchaseEdited.id);
  assert.equal(posted.status, 'posted');

  // 9) reflexo coerente no inventory/ledger
  const afterPostBalance = findBalance('p1', 'w3');
  const afterPostAvailable = Number(afterPostBalance?.qty_available || 0);
  assert.equal(afterPostAvailable, baseAvailable + 2, 'saldo disponível deve aumentar em 2');

  const ledgerAfterPost = getInventoryLedger().filter((row) => row.reference_document_id === purchaseEdited.id);
  assert.equal(ledgerAfterPost.length, beforePostMoves + 1);
  assert.ok(ledgerAfterPost.some((row) => row.direction === 'in' && row.movement_type === 'purchase_in' && Number(row.qty) === 2));

  // 10) garantir posted não editável
  expectThrows('posted não editável', () => saveDocument({
    id: purchaseEdited.id,
    type: 'purchase',
    date: '2026-04-22',
    supplier_id: 's3',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1300 }],
  }), /posted não pode ser editado/i);

  // 11) cancel purchase
  const cancelled = cancelDocumentById(purchaseEdited.id, 'Hardening cancel purchase');
  assert.equal(cancelled.status, 'cancelled');

  // 12) reversão coerente
  const afterCancelBalance = findBalance('p1', 'w3');
  const afterCancelAvailable = Number(afterCancelBalance?.qty_available || 0);
  assert.equal(afterCancelAvailable, baseAvailable, 'saldo deve voltar ao valor original');

  const ledgerAfterCancel = getInventoryLedger().filter((row) => row.reference_document_id === purchaseEdited.id);
  assert.ok(ledgerAfterCancel.some((row) => row.direction === 'out' && row.movement_type === 'purchase_reversal_out' && Number(row.qty) === 2));

  // 13) garantir cancelled não postável novamente
  expectThrows('cancelled não postável', () => postDocumentById(purchaseEdited.id), /cancelled não pode ser postado/i);

  // 13.1) tipo desconhecido deve falhar sem fallback silencioso
  expectThrows('tipo inválido', () => saveDocument({
    type: 'tipo_qualquer',
    date: '2026-04-20',
    supplier_id: 's1',
    destination: 'w3',
    lines: [{ product_id: 'p1', quantity: 1, unitPrice: 1200 }],
  }), /Tipo de documento inválido/i);

  const current = getDocumentById(purchaseEdited.id);
  assert.equal(current.status, 'cancelled');

  assert.ok(listDocuments({}).some((doc) => doc.type === 'purchase'), 'compras não encontradas');

  console.log('PURCHASES HARDENING OK');
}

run();
