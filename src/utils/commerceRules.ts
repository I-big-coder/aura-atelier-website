import {
  Product,
  CatalogFilterState,
  CartItem,
  Coupon,
  ShippingMethodType,
  PaymentMethodType,
  OrderRecord,
  CustomerProfile,
} from '../types/commerce';

export const FREE_SHIPPING_THRESHOLD = 250;

export function filterAndSortProducts(
  products: Product[],
  filters: CatalogFilterState
): Product[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (query) {
      const matchesText =
        product.name.toLowerCase().includes(query) ||
        product.subtitle.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.fabric.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      if (!matchesText) return false;
    }

    if (filters.category && filters.category !== 'All') {
      if (product.category !== filters.category) return false;
    }

    if (filters.size && filters.size !== 'All') {
      const hasSizeInStock = product.variants.some(
        (v) => v.size === filters.size && v.stock > 0
      );
      if (!hasSizeInStock) return false;
    }

    if (filters.color && filters.color !== 'All') {
      const hasColor = product.variants.some(
        (v) => v.colorName.toLowerCase() === filters.color.toLowerCase()
      );
      if (!hasColor) return false;
    }

    if (filters.fabric && filters.fabric !== 'All') {
      if (!product.fabric.toLowerCase().includes(filters.fabric.toLowerCase())) {
        return false;
      }
    }

    if (filters.maxPrice > 0 && product.price > filters.maxPrice) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'rating':
      sorted.sort((a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.ratingAvg - a.ratingAvg;
      });
      break;
  }

  return sorted;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
} {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  return {
    items: items.slice(startIndex, startIndex + safePageSize),
    totalItems,
    totalPages,
    currentPage,
  };
}

export interface CartCalculationResult {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  freeShippingRemaining: number;
  appliedCoupon: Coupon | null;
  promoError: string | null;
}

export function calculateCartTotals(
  items: CartItem[],
  coupons: Coupon[],
  promoCodeInput: string,
  shippingMethod: ShippingMethodType = 'standard'
): CartCalculationResult {
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  let baseShipping = 0;
  if (subtotal === 0) {
    baseShipping = 0;
  } else if (shippingMethod === 'atelier_courier') {
    baseShipping = 35;
  } else if (shippingMethod === 'express') {
    baseShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 25;
  } else {
    baseShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 18;
  }

  let discountAmount = 0;
  let shippingCost = baseShipping;
  let appliedCoupon: Coupon | null = null;
  let promoError: string | null = null;

  const cleanCode = promoCodeInput.trim().toUpperCase();
  if (cleanCode && subtotal > 0) {
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === cleanCode && c.active
    );
    if (!matched) {
      promoError = `Promo code "${cleanCode}" is invalid or expired.`;
    } else if (subtotal < matched.minOrderAmount) {
      promoError = `Code "${matched.code}" requires a minimum order of $${matched.minOrderAmount}.`;
    } else {
      appliedCoupon = matched;
      if (matched.discountType === 'percentage') {
        discountAmount = Number(
          ((subtotal * matched.discountValue) / 100).toFixed(2)
        );
      } else if (matched.discountType === 'fixed') {
        discountAmount = Math.min(subtotal, matched.discountValue);
      } else if (matched.discountType === 'free_shipping') {
        shippingCost = 0;
      }
    }
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number((taxableBase * 0.08).toFixed(2));
  const totalAmount = Number(
    (taxableBase + shippingCost + taxAmount).toFixed(2)
  );
  const freeShippingRemaining = Math.max(
    0,
    Number((FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2))
  );

  return {
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount,
    freeShippingRemaining,
    appliedCoupon,
    promoError,
  };
}

export interface CheckoutFormInput {
  recipientName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
}

export function validateCheckoutForm(
  form: CheckoutFormInput,
  paymentMethod: PaymentMethodType
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.recipientName || form.recipientName.trim().length < 2) {
    errors.recipientName = 'Please enter the recipient full name.';
  }
  if (
    !form.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    errors.email = 'Please enter a valid email address for your receipt.';
  }
  if (!form.phone || form.phone.trim().length < 7) {
    errors.phone = 'Please provide a contact phone number for courier updates.';
  }
  if (!form.street || form.street.trim().length < 4) {
    errors.street = 'Please enter a valid street address.';
  }
  if (!form.city || form.city.trim().length < 2) {
    errors.city = 'Please enter a valid city.';
  }
  if (!form.postalCode || form.postalCode.trim().length < 3) {
    errors.postalCode = 'Please enter a valid postal or ZIP code.';
  }
  if (!form.country || form.country.trim().length < 2) {
    errors.country = 'Please select or enter a destination country.';
  }

  if (paymentMethod === 'card') {
    const digitsOnly = (form.cardNumber || '').replace(/\s+/g, '');
    if (digitsOnly.length < 12 || !/^\d+$/.test(digitsOnly)) {
      errors.cardNumber = 'Enter a valid 16-digit card number.';
    }
    if (!form.cardExpiry || !/^\d{2}\/\d{2}$/.test(form.cardExpiry.trim())) {
      errors.cardExpiry = 'Use MM/YY format.';
    }
    if (!form.cardCvc || !/^\d{3,4}$/.test(form.cardCvc.trim())) {
      errors.cardCvc = 'Enter a 3 or 4 digit security code.';
    }
  }

  return errors;
}

export function computeStoreAnalytics(
  products: Product[],
  orders: OrderRecord[],
  customers: CustomerProfile[]
) {
  const activeOrders = orders.filter((o) => o.status !== 'Refunded');
  const totalRevenue = Number(
    activeOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
  );
  const refundedTotal = Number(
    orders
      .filter((o) => o.status === 'Refunded')
      .reduce((sum, o) => sum + o.totalAmount, 0)
      .toFixed(2)
  );
  const totalOrderCount = orders.length;
  const averageOrderValue =
    activeOrders.length > 0
      ? Number((totalRevenue / activeOrders.length).toFixed(2))
      : 0;

  const totalInventoryUnits = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0),
    0
  );

  const productSalesMap = new Map<
    string,
    { productId: string; name: string; unitsSold: number; revenue: number }
  >();

  for (const order of activeOrders) {
    for (const item of order.items) {
      const existing = productSalesMap.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += item.quantity;
      existing.revenue = Number(
        (existing.revenue + item.quantity * item.unitPrice).toFixed(2)
      );
      productSalesMap.set(item.productId, existing);
    }
  }

  const topProducts = Array.from(productSalesMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  return {
    totalRevenue,
    refundedTotal,
    totalOrderCount,
    averageOrderValue,
    totalCustomers: customers.length,
    totalInventoryUnits,
    topProducts,
    conversionRate: 3.8,
    monthlyTraffic: 48200,
  };
}
