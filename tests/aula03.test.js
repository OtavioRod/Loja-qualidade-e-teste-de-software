const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateCoupon } = require('../src/domain/coupon');
const { quoteLines } = require('../src/domain/pricing');
const { setClock,resetClock,REFERENCE_INSTANT } = require('../src/domain/clock');
const cupom = (value,expiresAt) => ({code:'TESTE',type:'percent',value,expiresAt,active:true});
function cotar(coupon=null) {
  return quoteLines({lines:[{productId:'produto-teste',name:'Produto Teste',unitPrice:150,quantity:2}],coupon});
}
test('confirmação: cupom vencido é recusado', () => {
  setClock(REFERENCE_INSTANT);
  try {
    assert.equal(evaluateCoupon(cupom(20,'2026-10-06T23:59:59Z')).ok,false);
  } finally {resetClock();}
});
test('regressão: cupom válido de 20% não acumula', () => {
  setClock(REFERENCE_INSTANT);
  try {
    const r = cotar(cupom(20,'2026-12-31T23:59:59Z'));
    assert.equal(r.ok,true);
    assert.equal(r.discount,60);
  } finally {resetClock();}
});
test('regressão: cupom de 5% preserva desconto automático maior', () => {
  const r = cotar(cupom(5,'2099-12-31T23:59:59Z'));
  assert.equal(r.ok,true);
  assert.equal(r.discount,30);
});
test('regressão: cupom inativo continua recusado', () => {
  assert.equal(evaluateCoupon({...cupom(20,'2099-12-31'),active:false}).ok,false);
});
////////////////////////////////////////////


test('confirmação: cupom com valor negativo é tratado como inválido', () => {
  const r = cotar(cupom(-10, '2099-12-31T23:59:59Z'));
  assert.equal(r.ok, false);
});

test('regressão: cupom válido de 20% não acumula', () => {
  setClock(REFERENCE_INSTANT);
  try {
    const r = cotar(cupom(20, '2026-12-31T23:59:59Z'));
    assert.equal(r.ok, true);
    assert.equal(r.discount, 60);
  } finally {
    resetClock();
  }
});

test('regressão: cupom de 5% preserva desconto automático maior', () => {
  const r = cotar(cupom(5, '2099-12-31T23:59:59Z'));
  assert.equal(r.ok, true);
  assert.equal(r.discount, 30);
});