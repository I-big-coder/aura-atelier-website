/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ShoppingBag, CheckCircle2, X } from 'lucide-react';
import {
  Product,
  ProductVariant,
  ProductReview,
  Coupon,
  OrderRecord,
  OrderStatus,
  CustomerProfile,
  CartItem,
  ShippingAddress,
  CatalogFilterState,
  StaticPageKey,
} from './types/commerce';
import {
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_ADDRESSES,
} from './data/seedCatalog';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  syncOrderToFirestore,
  syncPrivateProfileToFirestore,
} from './lib/firebase';
import { HomeView } from './components/HomeView';
import { ShopCatalogView } from './components/ShopCatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import {
  CartDrawer,
  CheckoutView,
  OrderConfirmationView,
} from './components/CartAndCheckoutViews';
import {
  AccountPortalView,
  StaticPageView,
} from './components/AccountAndStaticViews';
import { AdminDashboardView } from './components/AdminDashboardView';

type ActiveRoute =
  | 'home'
  | 'shop'
  | 'pdp'
  | 'checkout'
  | 'order-confirmation'
  | 'account'
  | 'admin'
  | 'static';

const DEFAULT_FILTERS: CatalogFilterState = {
  searchQuery: '',
  category: 'All',
  size: 'All',
  color: 'All',
  fabric: 'All',
  maxPrice: 1500,
  sortBy: 'featured',
};

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('home');
  const [staticPage, setStaticPage] = useState<StaticPageKey>('about');

  // Store Data
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [addresses, setAddresses] = useState<ShippingAddress[]>(INITIAL_ADDRESSES);

  // Active Product & Order Confirmation
  const [selectedProductId, setSelectedProductId] = useState<string>(
    INITIAL_PRODUCTS[0].id
  );
  const [latestOrder, setLatestOrder] = useState<OrderRecord>(INITIAL_ORDERS[0]);

  // Catalog Filters
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_FILTERS);

  // Persistent Shopping Bag
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_atelier_cart_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to initial item
    }
    const p = INITIAL_PRODUCTS[0];
    const v = p.variants[1];
    return [
      {
        productId: p.id,
        variantId: v.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        fabric: p.fabric,
        price: p.price,
        image: p.images[0],
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        quantity: 1,
        maxStock: v.stock,
      },
    ];
  });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // Persistent Wishlist
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aura_atelier_wishlist_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['prod-monolith-overcoat', 'prod-solstice-merino-turtleneck'];
  });

  // User Session State
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: 'customer' | 'admin';
    isFirebaseUser?: boolean;
  }>({
    uid: 'demo-member-aura',
    name: 'Elena Rostova',
    email: 'elena.rostova@aura-atelier.com',
    phone: '+1 (212) 555-0194',
    role: 'customer',
    isFirebaseUser: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Sync Cart & Wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aura_atelier_cart_v1', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_atelier_wishlist_v1', JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  // Fetch initial state from Express backend
  useEffect(() => {
    fetch('/api/store')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
          if (Array.isArray(data.reviews)) setReviews(data.reviews);
          if (Array.isArray(data.coupons)) setCoupons(data.coupons);
          if (Array.isArray(data.orders)) setOrders(data.orders);
          if (Array.isArray(data.customers)) setCustomers(data.customers);
        }
      })
      .catch(() => {
        // Seed state already active
      });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setCurrentUser({
          uid: fbUser.uid,
          name: fbUser.displayName || 'Atelier Member',
          email: fbUser.email || 'client@aura-atelier.com',
          phone: '+1 (212) 555-0194',
          role:
            fbUser.email === 'bhavikthanki2000@gmail.com' ? 'admin' : 'customer',
          isFirebaseUser: true,
        });
      }
    });
    return () => unsub();
  }, []);

  const activeProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  // Dynamic SEO Title & Description
  useEffect(() => {
    if (route === 'pdp' && activeProduct) {
      document.title = `${activeProduct.name} | AURA ATELIER`;
    } else if (route === 'shop') {
      document.title = `Shop ${filters.category === 'All' ? 'Collection' : filters.category} | AURA ATELIER`;
    } else if (route === 'admin') {
      document.title = `Atelier Admin Console | AURA ATELIER`;
    } else {
      document.title = `AURA ATELIER – Minimalist Luxury Essentials & Tailoring`;
    }
  }, [route, activeProduct, filters.category]);

  // Handlers
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setRoute('pdp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (
    product: Product,
    variant: ProductVariant,
    quantity = 1,
    buyNow = false
  ) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: Math.min(variant.stock, item.quantity + quantity),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          fabric: product.fabric,
          price: product.price,
          image: product.images[0],
          size: variant.size,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          quantity,
          maxStock: variant.stock,
        },
      ];
    });

    if (buyNow) {
      setIsCartDrawerOpen(false);
      setRoute('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsCartDrawerOpen(true);
      showToast(`Added ${product.name} (${variant.size}) to Shopping Bag.`);
    }
  };

  const handleQuickAdd = (product: Product) => {
    const availVariant =
      product.variants.find((v) => v.stock > 0) || product.variants[0];
    if (availVariant) {
      handleAddToCart(product, availVariant, 1, false);
    }
  };

  const handleUpdateCartQuantity = (variantId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(item.maxStock, nextQty) }
          : item
      )
    );
  };

  const handleRemoveCartItem = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      return next;
    });
  };

  const handlePlaceOrder = async (payload: {
    shippingAddress: ShippingAddress;
    shippingMethod: OrderRecord['shippingMethod'];
    paymentMethod: OrderRecord['paymentMethod'];
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    promoCode?: string;
  }) => {
    const orderNumber = `ORD-AURA-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderItems = cartItems.map((ci) => ({
      productId: ci.productId,
      variantId: ci.variantId,
      productName: ci.name,
      size: ci.size,
      colorName: ci.colorName,
      quantity: ci.quantity,
      unitPrice: ci.price,
      image: ci.image,
    }));

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber,
        ownerId: currentUser.uid,
        customerName: payload.shippingAddress.recipientName,
        customerEmail: payload.shippingAddress.email,
        shippingAddress: payload.shippingAddress,
        shippingMethod: payload.shippingMethod,
        paymentMethod: payload.paymentMethod,
        items: orderItems,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        shippingCost: payload.shippingCost,
        taxAmount: payload.taxAmount,
        totalAmount: payload.totalAmount,
        promoCode: payload.promoCode,
      }),
    });

    const created: OrderRecord = res.ok
      ? await res.json()
      : {
          id: `ord-${Date.now()}`,
          orderNumber,
          ownerId: currentUser.uid,
          customerName: payload.shippingAddress.recipientName,
          customerEmail: payload.shippingAddress.email,
          shippingAddress: payload.shippingAddress,
          shippingMethod: payload.shippingMethod,
          paymentMethod: payload.paymentMethod,
          items: orderItems,
          subtotal: payload.subtotal,
          discountAmount: payload.discountAmount,
          shippingCost: payload.shippingCost,
          taxAmount: payload.taxAmount,
          totalAmount: payload.totalAmount,
          promoCode: payload.promoCode,
          status: 'Processing',
          trackingNumber: `DHL-AA-${Math.floor(100000000 + Math.random() * 900000000)}`,
          estimatedDelivery: 'Estimated arrival in 3–5 business days',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    setOrders((prev) => [created, ...prev]);
    setLatestOrder(created);
    setCartItems([]);
    setPromoCode('');
    await syncOrderToFirestore({
      id: created.id,
      orderNumber: created.orderNumber,
      totalAmount: created.totalAmount,
      paymentMethod: created.paymentMethod,
    });
    setRoute('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-[#0A0A0B]">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#0A0A0B] text-[#F9F9F8] border-b border-[#242428] flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setRoute('home');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#F9F9F8] whitespace-nowrap shrink-0"
        >
          AURA ATELIER
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#B4B4BB]"
        >
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              setFilters(DEFAULT_FILTERS);
              setRoute('shop');
            }}
            className={`hover:text-[#F9F9F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              route === 'shop' && filters.category === 'All' ? 'text-[#F9F9F8] underline' : ''
            }`}
          >
            Shop Archive
          </a>
          <a
            href="#outerwear"
            onClick={(e) => {
              e.preventDefault();
              setFilters({ ...DEFAULT_FILTERS, category: 'Outerwear' });
              setRoute('shop');
            }}
            className={`hover:text-[#F9F9F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              route === 'shop' && filters.category === 'Outerwear' ? 'text-[#F9F9F8] underline' : ''
            }`}
          >
            Outerwear
          </a>
          <a
            href="#knitwear"
            onClick={(e) => {
              e.preventDefault();
              setFilters({ ...DEFAULT_FILTERS, category: 'Knitwear' });
              setRoute('shop');
            }}
            className={`hover:text-[#F9F9F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              route === 'shop' && filters.category === 'Knitwear' ? 'text-[#F9F9F8] underline' : ''
            }`}
          >
            Knitwear
          </a>
          <a
            href="#account"
            onClick={(e) => {
              e.preventDefault();
              setRoute('account');
            }}
            className={`hover:text-[#F9F9F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              route === 'account' ? 'text-[#F9F9F8] underline' : ''
            }`}
          >
            Account
          </a>
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              setRoute('admin');
            }}
            className={`hover:text-[#F9F9F8] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              route === 'admin' ? 'text-[#F9F9F8] underline' : ''
            }`}
          >
            Admin
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e2ff4d] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">Shopping Bag ({totalBagCount})</span>
          </button>
        </div>
      </header>

      {/* Mobile Secondary Navigation Strip */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden bg-[#141416] text-[#B4B4BB] border-b border-[#242428] px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto text-xs"
      >
        <button
          type="button"
          onClick={() => {
            setFilters(DEFAULT_FILTERS);
            setRoute('shop');
          }}
          className="whitespace-nowrap shrink-0 hover:text-[#F9F9F8]"
        >
          Shop Archive
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({ ...DEFAULT_FILTERS, category: 'Outerwear' });
            setRoute('shop');
          }}
          className="whitespace-nowrap shrink-0 hover:text-[#F9F9F8]"
        >
          Outerwear
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({ ...DEFAULT_FILTERS, category: 'Knitwear' });
            setRoute('shop');
          }}
          className="whitespace-nowrap shrink-0 hover:text-[#F9F9F8]"
        >
          Knitwear
        </button>
        <button
          type="button"
          onClick={() => setRoute('account')}
          className="whitespace-nowrap shrink-0 hover:text-[#F9F9F8]"
        >
          Account
        </button>
        <button
          type="button"
          onClick={() => setRoute('admin')}
          className="whitespace-nowrap shrink-0 hover:text-[#F9F9F8]"
        >
          Admin
        </button>
      </nav>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className="bg-[#141416] text-[#F9F9F8] border-b border-[#2E2E32] px-6 py-2.5 text-xs flex items-center justify-between"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4FF00]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="text-[#9E9EA4] hover:text-[#F9F9F8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">
        {route === 'home' && (
          <HomeView
            products={products}
            wishlistIds={wishlistIds}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
            onToggleWishlist={handleToggleWishlist}
            onNavigateShop={(preset) => {
              setFilters({
                ...DEFAULT_FILTERS,
                ...(preset?.category ? { category: preset.category } : {}),
                ...(preset?.searchQuery ? { searchQuery: preset.searchQuery } : {}),
              });
              setRoute('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateStatic={(page) => {
              setStaticPage(page);
              setRoute('static');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSubscribeNewsletter={async (email) => {
              const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to subscribe.');
              return data.message;
            }}
          />
        )}

        {route === 'shop' && (
          <ShopCatalogView
            products={products}
            filters={filters}
            wishlistIds={wishlistIds}
            onUpdateFilters={(patch) =>
              setFilters((prev) => ({ ...prev, ...patch }))
            }
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {route === 'pdp' && activeProduct && (
          <ProductDetailView
            product={activeProduct}
            allProducts={products}
            reviews={reviews}
            wishlistIds={wishlistIds}
            onBackToCatalog={() => setRoute('shop')}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onSubmitReview={async (revPayload) => {
              const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...revPayload,
                  authorId: currentUser.uid,
                }),
              });
              if (res.ok) {
                const newRev: ProductReview = await res.json();
                setReviews((prev) => [newRev, ...prev]);
              }
            }}
          />
        )}

        {route === 'checkout' && (
          <CheckoutView
            items={cartItems}
            coupons={coupons}
            promoCode={promoCode}
            savedAddresses={addresses}
            currentUserEmail={currentUser.email}
            currentUserName={currentUser.name}
            onApplyPromoCode={(code) => setPromoCode(code)}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onPlaceOrder={handlePlaceOrder}
            onContinueShopping={() => setRoute('shop')}
          />
        )}

        {route === 'order-confirmation' && (
          <OrderConfirmationView
            order={latestOrder}
            onContinueShopping={() => setRoute('home')}
            onViewOrderHistory={() => setRoute('account')}
          />
        )}

        {route === 'account' && (
          <AccountPortalView
            user={currentUser}
            orders={orders}
            addresses={addresses}
            wishlistProducts={products.filter((p) => wishlistIds.includes(p.id))}
            onGoogleSignIn={async () => {
              await signInWithGooglePopup();
            }}
            onSignOut={async () => {
              await signOutFirebase();
              setCurrentUser({
                uid: 'demo-member-aura',
                name: 'Elena Rostova',
                email: 'elena.rostova@aura-atelier.com',
                phone: '+1 (212) 555-0194',
                role: 'customer',
                isFirebaseUser: false,
              });
            }}
            onSwitchDemoRole={(role) => {
              if (role === 'admin') {
                setCurrentUser({
                  uid: 'admin-aura-founder',
                  name: 'Bhavik Thanki (Atelier Director)',
                  email: 'bhavikthanki2000@gmail.com',
                  phone: '+1 (415) 890-2210',
                  role: 'admin',
                  isFirebaseUser: false,
                });
              } else {
                setCurrentUser({
                  uid: 'demo-member-aura',
                  name: 'Elena Rostova',
                  email: 'elena.rostova@aura-atelier.com',
                  phone: '+1 (212) 555-0194',
                  role: 'customer',
                  isFirebaseUser: false,
                });
              }
            }}
            onUpdateProfile={async (patch) => {
              setCurrentUser((prev) => ({ ...prev, ...patch }));
              await syncPrivateProfileToFirestore({
                email: patch.email,
                fullName: patch.name,
                defaultAddress: addresses[0]?.street,
              });
            }}
            onAddAddress={(addr) => {
              setAddresses((prev) => [
                ...prev,
                { ...addr, id: `addr-${Date.now()}` },
              ]);
            }}
            onDeleteAddress={(id) => {
              setAddresses((prev) => prev.filter((a) => a.id !== id));
            }}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {route === 'admin' && (
          <AdminDashboardView
            products={products}
            orders={orders}
            customers={customers}
            coupons={coupons}
            onCreateOrUpdateProduct={async (prodPatch) => {
              const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prodPatch),
              });
              if (res.ok) {
                const saved: Product = await res.json();
                setProducts((prev) => {
                  const exists = prev.some((p) => p.id === saved.id);
                  return exists
                    ? prev.map((p) => (p.id === saved.id ? saved : p))
                    : [saved, ...prev];
                });
              }
            }}
            onBulkImportProducts={async (items) => {
              const res = await fetch('/api/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
              });
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.products)) {
                  setProducts((prev) => [...data.products, ...prev]);
                }
              }
            }}
            onDeleteProduct={async (productId) => {
              await fetch(`/api/products/${productId}`, { method: 'DELETE' });
              setProducts((prev) => prev.filter((p) => p.id !== productId));
            }}
            onUpdateOrderStatus={async (orderId, status: OrderStatus) => {
              const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
              });
              if (res.ok) {
                setOrders((prev) =>
                  prev.map((o) => (o.id === orderId ? { ...o, status } : o))
                );
              }
            }}
            onCreateCoupon={async (cpnPatch) => {
              const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cpnPatch),
              });
              if (res.ok) {
                const saved: Coupon = await res.json();
                setCoupons((prev) => [
                  saved,
                  ...prev.filter((c) => c.code !== saved.code),
                ]);
              }
            }}
            onToggleCoupon={async (couponId) => {
              await fetch(`/api/coupons/${couponId}/toggle`, { method: 'PATCH' });
              setCoupons((prev) =>
                prev.map((c) =>
                  c.id === couponId ? { ...c, active: !c.active } : c
                )
              );
            }}
          />
        )}

        {route === 'static' && (
          <StaticPageView
            pageKey={staticPage}
            onNavigateHome={() => setRoute('home')}
            onNavigateShop={() => setRoute('shop')}
            onSubmitContact={async (payload) => {
              await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
            }}
          />
        )}
      </main>

      {/* Slide-Over Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        items={cartItems}
        coupons={coupons}
        promoCode={promoCode}
        onClose={() => setIsCartDrawerOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onApplyPromoCode={(code) => setPromoCode(code)}
        onProceedToCheckout={() => {
          setIsCartDrawerOpen(false);
          setRoute('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onViewFullCart={() => {
          setIsCartDrawerOpen(false);
          setRoute('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#0A0A0B] text-[#B4B4BB] border-t border-[#242428] mt-16">
        <div className="max-w-[1360px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3">
            <p className="font-display text-base font-bold text-[#F9F9F8]">
              AURA ATELIER
            </p>
            <p className="text-[#9E9EA4] leading-relaxed">
              Minimalist luxury essentials tailored in Milan, Biella, Como, and Zurich for modern
              professionals.
            </p>
            <p className="font-mono text-[11px] text-[#6E6E73]">
              Milano · Zurich · New York
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[#F9F9F8]">Collections</p>
            <ul className="space-y-1.5">
              {(['Outerwear', 'Knitwear', 'Tailoring', 'Silk & Shirts', 'Accessories'] as const).map(
                (cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => {
                        setFilters({ ...DEFAULT_FILTERS, category: cat });
                        setRoute('shop');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-[#F9F9F8] hover:underline"
                    >
                      {cat}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[#F9F9F8]">Atelier & Policies</p>
            <ul className="space-y-1.5">
              {[
                { key: 'about' as StaticPageKey, label: 'About the Atelier' },
                { key: 'contact' as StaticPageKey, label: 'Contact Concierge' },
                { key: 'faq' as StaticPageKey, label: 'Client FAQ' },
                { key: 'shipping-returns' as StaticPageKey, label: 'Shipping & Returns Policy' },
                { key: 'size-guide' as StaticPageKey, label: 'Size & Measurement Guide' },
              ].map((link) => (
                <li key={link.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setStaticPage(link.key);
                      setRoute('static');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#F9F9F8] hover:underline"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[#F9F9F8]">Legal & Architecture</p>
            <ul className="space-y-1.5">
              {[
                { key: 'privacy' as StaticPageKey, label: 'Privacy Policy' },
                { key: 'terms' as StaticPageKey, label: 'Terms of Service' },
                { key: 'setup-guide' as StaticPageKey, label: 'Setup & Deployment Guide' },
                { key: 'not-found' as StaticPageKey, label: '404 Archive State' },
              ].map((link) => (
                <li key={link.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setStaticPage(link.key);
                      setRoute('static');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#F9F9F8] hover:underline"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#F9F9F8] hover:underline"
                >
                  XML Sitemap (/sitemap.xml)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#242428] px-6 py-4 text-[11px] text-[#6E6E73]">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 AURA ATELIER S.r.l. All rights reserved.</span>
            <span>Complimentary Express Courier · 30-Day Atelier Returns</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
