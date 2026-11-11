import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortProducts,
  paginateItems,
  calculateCartTotals,
  validateCheckoutForm,
  computeStoreAnalytics,
} from './commerceRules';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
} from '../data/seedCatalog';
import { CartItem } from '../types/commerce';

test('filterAndSortProducts filters by category, fabric, and sorts by price ascending', () => {
  const outerwear = filterAndSortProducts(INITIAL_PRODUCTS, {
    searchQuery: '',
    category: 'Outerwear',
    size: 'All',
    color: 'All',
    fabric: 'All',
    maxPrice: 2000,
    sortBy: 'price-asc',
  });
  assert.equal(outerwear.length, 2);
  assert.ok(outerwear[0].price <= outerwear[1].price);
  assert.equal(outerwear[0].category, 'Outerwear');

  const silkSearch = filterAndSortProducts(INITIAL_PRODUCTS, {
    searchQuery: 'Mulberry',
    category: 'All',
    size: 'All',
    color: 'All',
    fabric: 'Silk',
    maxPrice: 1000,
    sortBy: 'featured',
  });
  assert.equal(silkSearch.length, 1);
  assert.equal(silkSearch[0].id, 'prod-lumina-mulberry-silk-shirt');
});

test('paginateItems slices array accurately and clamps out-of-range pages', () => {
  const page1 = paginateItems(INITIAL_PRODUCTS, 1, 4);
  assert.equal(page1.items.length, 4);
  assert.equal(page1.totalPages, 3);
  assert.equal(page1.currentPage, 1);

  const page3 = paginateItems(INITIAL_PRODUCTS, 99, 4);
  assert.equal(page3.currentPage, 3);
  assert.equal(page3.items.length, 2);
});

test('calculateCartTotals computes subtotal, AURA20 percentage discount, free shipping, and tax', () => {
  const sampleItems: CartItem[] = [
    {
      productId: 'prod-solstice-merino-turtleneck',
      variantId: 'var-sol-m-chk',
      slug: 'solstice-heavyweight-ribbed-merino-turtleneck',
      name: 'Solstice Ribbed Merino Turtleneck',
      category: 'Knitwear',
      fabric: '100% Extrafine Merino Wool',
      price: 460,
      image: '/img.jpg',
      size: 'M',
      colorName: 'Chalk White',
      colorHex: '#F4F3EF',
      quantity: 1,
      maxStock: 10,
    },
  ];

  const withAura20 = calculateCartTotals(
    sampleItems,
    INITIAL_COUPONS,
    'aura20',
    'standard'
  );
  assert.equal(withAura20.subtotal, 460);
  assert.equal(withAura20.discountAmount, 92); // 20% of 460
  assert.equal(withAura20.shippingCost, 0); // > $250 threshold
  assert.equal(withAura20.taxAmount, 29.44); // 8% of (460 - 92 = 368)
  assert.equal(withAura20.totalAmount, 397.44);
  assert.equal(withAura20.promoError, null);

  const invalidPromo = calculateCartTotals(
    sampleItems,
    INITIAL_COUPONS,
    'INVALIDCODE',
    'standard'
  );
  assert.equal(invalidPromo.discountAmount, 0);
  assert.ok(invalidPromo.promoError?.includes('INVALIDCODE'));
});

test('validateCheckoutForm enforces required shipping and card fields', () => {
  const invalidErrors = validateCheckoutForm(
    {
      recipientName: '',
      email: 'not-an-email',
      phone: '12',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      cardNumber: '123',
      cardExpiry: '1228',
      cardCvc: '1',
    },
    'card'
  );
  assert.ok(invalidErrors.recipientName);
  assert.ok(invalidErrors.email);
  assert.ok(invalidErrors.cardNumber);
  assert.ok(invalidErrors.cardExpiry);
  assert.ok(invalidErrors.cardCvc);

  const validCodErrors = validateCheckoutForm(
    {
      recipientName: 'Elena Rostova',
      email: 'elena@aura-atelier.com',
      phone: '+1 212 555 0194',
      street: '458 Broome Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10013',
      country: 'United States',
    },
    'cod'
  );
  assert.equal(Object.keys(validCodErrors).length, 0);
});

test('computeStoreAnalytics aggregates revenue, inventory units, and top products', () => {
  const metrics = computeStoreAnalytics(
    INITIAL_PRODUCTS,
    INITIAL_ORDERS,
    INITIAL_CUSTOMERS
  );
  assert.ok(metrics.totalRevenue > 3000);
  assert.equal(metrics.totalOrderCount, 3);
  assert.ok(metrics.totalInventoryUnits > 100);
  assert.ok(metrics.topProducts.length >= 2);
});
