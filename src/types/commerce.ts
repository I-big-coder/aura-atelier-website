export type ProductCategory =
  | 'Outerwear'
  | 'Knitwear'
  | 'Tailoring'
  | 'Silk & Shirts'
  | 'Accessories';

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface ProductVariant {
  id: string;
  sku: string;
  size: GarmentSize;
  colorName: string;
  colorHex: string;
  stock: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: ProductCategory;
  fabric: string;
  origin: string;
  careInstructions: string[];
  fitNotes: string;
  price: number;
  compareAtPrice?: number;
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: string[];
  variants: ProductVariant[];
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  category: ProductCategory;
  fabric: string;
  price: number;
  image: string;
  size: GarmentSize;
  colorName: string;
  colorHex: string;
  quantity: number;
  maxStock: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
  usageCount: number;
}

export type PaymentMethodType = 'card' | 'express_pay' | 'paypal' | 'cod';
export type ShippingMethodType = 'standard' | 'express' | 'atelier_courier';
export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Refunded';

export interface ShippingAddress {
  id: string;
  label: string;
  recipientName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItemRecord {
  productId: string;
  variantId: string;
  productName: string;
  size: GarmentSize;
  colorName: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  ownerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodType;
  paymentMethod: PaymentMethodType;
  items: OrderItemRecord[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  trackingNumber: string;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface CatalogFilterState {
  searchQuery: string;
  category: string;
  size: string;
  color: string;
  fabric: string;
  maxPrice: number;
  sortBy: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
}

export type StaticPageKey =
  | 'about'
  | 'contact'
  | 'faq'
  | 'shipping-returns'
  | 'size-guide'
  | 'privacy'
  | 'terms'
  | 'setup-guide'
  | 'not-found';
