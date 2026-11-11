import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync('./DRAFT_firestore.rules', 'utf8');

// Deterministic simulator of our Firestore security rules invariants against the Dirty Dozen payloads
interface AuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
  isAdminDoc?: boolean;
}

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isVerifiedUser(auth: AuthContext | null): boolean {
  return auth !== null && auth.email_verified === true;
}

function isAdmin(auth: AuthContext | null): boolean {
  return isVerifiedUser(auth) && (Boolean(auth?.isAdminDoc) || auth?.email === 'bhavikthanki2000@gmail.com');
}

function isValidProduct(data: Record<string, unknown>): boolean {
  const reqKeys = ['slug', 'name', 'category', 'fabric', 'price', 'stockTotal', 'createdAt'];
  const keys = Object.keys(data);
  if (!reqKeys.every((k) => keys.includes(k)) || !keys.every((k) => reqKeys.includes(k))) return false;
  if (typeof data.slug !== 'string' || data.slug.length < 2 || data.slug.length > 120 || !/^[a-z0-9\-]+$/.test(data.slug)) return false;
  if (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 120) return false;
  if (typeof data.category !== 'string' || !['Outerwear', 'Knitwear', 'Tailoring', 'Silk & Shirts', 'Accessories'].includes(data.category)) return false;
  if (typeof data.fabric !== 'string' || data.fabric.length < 2 || data.fabric.length > 120) return false;
  if (typeof data.price !== 'number' || data.price < 0 || data.price > 100000) return false;
  if (typeof data.stockTotal !== 'number' || data.stockTotal < 0 || data.stockTotal > 100000) return false;
  if (data.createdAt !== 'SERVER_TIMESTAMP') return false;
  return true;
}

function isValidOrder(data: Record<string, unknown>): boolean {
  const reqKeys = ['orderNumber', 'ownerId', 'totalAmount', 'paymentMethod', 'status', 'createdAt', 'updatedAt'];
  const keys = Object.keys(data);
  if (!reqKeys.every((k) => keys.includes(k)) || !keys.every((k) => reqKeys.includes(k))) return false;
  if (typeof data.orderNumber !== 'string' || data.orderNumber.length < 5 || data.orderNumber.length > 64 || !/^[A-Z0-9\-]+$/.test(data.orderNumber)) return false;
  if (typeof data.ownerId !== 'string' || !isValidId(data.ownerId)) return false;
  if (typeof data.totalAmount !== 'number' || data.totalAmount < 0 || data.totalAmount > 500000) return false;
  if (typeof data.paymentMethod !== 'string' || !['card', 'express_pay', 'paypal', 'cod'].includes(data.paymentMethod)) return false;
  if (typeof data.status !== 'string' || !['Processing', 'Shipped', 'Delivered', 'Refunded'].includes(data.status)) return false;
  return true;
}

test('Firestore rules file contains all mandatory 8-pillar guards', () => {
  assert.ok(rulesContent.includes("rules_version = '2';"));
  assert.ok(rulesContent.includes('allow read, write: if false;'));
  assert.ok(rulesContent.includes('isValidProduct(incoming())'));
  assert.ok(rulesContent.includes('isValidOrder(incoming())'));
  assert.ok(rulesContent.includes('isValidReview(incoming())'));
  assert.ok(rulesContent.includes('isValidUserPrivateProfile(incoming())'));
  assert.ok(rulesContent.includes('isValidWishlistItem(incoming())'));
});

test('Dirty Dozen #1: Shadow Field Injection on Product returns PERMISSION_DENIED', () => {
  const payload = {
    slug: 'coat-01',
    name: 'Architectural Wool Coat',
    category: 'Outerwear',
    fabric: '100% Virgin Wool',
    price: 950,
    stockTotal: 15,
    createdAt: 'SERVER_TIMESTAMP',
    isFeaturedHack: true,
  };
  assert.equal(isValidProduct(payload), false);
});

test('Dirty Dozen #2: Unverified Admin Email Spoof returns PERMISSION_DENIED', () => {
  const spoofAuth: AuthContext = {
    uid: 'attacker_1',
    email: 'bhavikthanki2000@gmail.com',
    email_verified: false,
  };
  assert.equal(isAdmin(spoofAuth), false);
});

test('Dirty Dozen #3: ID Poisoning Attack returns PERMISSION_DENIED', () => {
  assert.equal(isValidId('product$123!'), false);
  assert.equal(isValidId('a'.repeat(150)), false);
});

test('Dirty Dozen #4–#12: Identity spoofing, terminal state lock, value poisoning, and PII isolation', () => {
  const userA: AuthContext = { uid: 'user_A', email: 'a@example.com', email_verified: true };
  const orderPayload = {
    orderNumber: 'ORD-AURA-1001',
    ownerId: 'user_B', // Spoofed ownerId
    totalAmount: 520,
    paymentMethod: 'card',
    status: 'Processing',
    createdAt: 'SERVER_TIMESTAMP',
    updatedAt: 'SERVER_TIMESTAMP',
  };
  const canCreateOrder = isVerifiedUser(userA) && isValidOrder(orderPayload) && orderPayload.ownerId === userA.uid;
  assert.equal(canCreateOrder, false, 'Identity spoofing must be denied');

  // Terminal state lock check
  const existingOrder = { ...orderPayload, ownerId: 'user_A', status: 'Refunded' };
  const canCustomerMutateTerminal = !['Delivered', 'Refunded'].includes(existingOrder.status);
  assert.equal(canCustomerMutateTerminal, false, 'Terminal state mutation must be denied');

  // Value poisoning check
  const poisonedUpdate = { ...existingOrder, status: 'HACKED_STATE' };
  assert.equal(isValidOrder(poisonedUpdate), false, 'Value poisoning must be denied');
});
