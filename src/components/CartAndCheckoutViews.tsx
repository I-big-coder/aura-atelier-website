import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Lock,
  CheckCircle2,
  Printer,
  Mail,
  Truck,
  CreditCard,
  Tag,
} from 'lucide-react';
import {
  CartItem,
  Coupon,
  ShippingAddress,
  ShippingMethodType,
  PaymentMethodType,
  OrderRecord,
} from '../types/commerce';
import {
  calculateCartTotals,
  validateCheckoutForm,
  FREE_SHIPPING_THRESHOLD,
} from '../utils/commerceRules';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  coupons: Coupon[];
  promoCode: string;
  onClose: () => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onApplyPromoCode: (code: string) => void;
  onProceedToCheckout: () => void;
  onViewFullCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  coupons,
  promoCode,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onApplyPromoCode,
  onProceedToCheckout,
  onViewFullCart,
}) => {
  const [promoInput, setPromoInput] = useState(promoCode);
  if (!isOpen) return null;

  const calc = calculateCartTotals(items, coupons, promoCode, 'standard');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="w-full max-w-md bg-[#F9F9F8] h-full flex flex-col justify-between border-l border-[#0A0A0B]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4E4E0] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0A0A0B]">
              Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shopping bag"
              className="p-1.5 text-[#0A0A0B] hover:bg-[#EAE9E4]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="text-xs text-[#6E6E73]">
            {calc.freeShippingRemaining > 0 ? (
              <span>
                Add{' '}
                <strong className="font-mono tabular-nums text-[#0A0A0B]">
                  ${calc.freeShippingRemaining.toFixed(2)}
                </strong>{' '}
                more for Complimentary DHL Express Courier
              </span>
            ) : (
              <span className="text-[#16A34A] font-medium">
                ✓ Unlocked Complimentary DHL Express Courier ($250+ threshold)
              </span>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="font-display text-base font-semibold text-[#0A0A0B]">
                Your Atelier Shopping Bag is Empty
              </p>
              <p className="text-xs text-[#6E6E73]">
                Explore our double-faced wool outerwear, 5-gauge merino knitwear, and Como silk.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Continue Exploring
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 p-3.5 bg-[#F1F0EC] border border-[#E4E4E0]"
              >
                <div className="w-20 h-24 bg-[#E5E4DF] shrink-0 overflow-hidden">
                  <ResilientImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#0A0A0B]">{item.name}</p>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5">
                        {item.colorName} · Size {item.size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.variantId)}
                      aria-label={`Remove ${item.name} from bag`}
                      className="text-[#6E6E73] hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-[#D4D4CE] bg-[#F9F9F8]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="p-1.5 text-[#0A0A0B]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="p-1.5 text-[#0A0A0B]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono tabular-nums text-xs font-semibold text-[#0A0A0B]">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-6 bg-[#F1F0EC] border-t border-[#E4E4E0] space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onApplyPromoCode(promoInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code (e.g. AURA20, WELCOME10)"
                aria-label="Promo code"
                className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#F9F9F8] border border-[#D4D4CE]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Apply
              </button>
            </form>

            {calc.promoError && (
              <p className="text-xs text-[#DC2626]">{calc.promoError}</p>
            )}
            {calc.appliedCoupon && (
              <p className="text-xs text-[#16A34A] font-medium">
                ✓ Applied {calc.appliedCoupon.code}: {calc.appliedCoupon.description}
              </p>
            )}

            <div className="space-y-1.5 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-[#6E6E73]">
                <span>Subtotal</span>
                <span>${calc.subtotal.toFixed(2)}</span>
              </div>
              {calc.discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Discount ({calc.appliedCoupon?.code})</span>
                  <span>-${calc.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6E73]">
                <span>Estimated Shipping</span>
                <span>{calc.shippingCost === 0 ? 'FREE' : `$${calc.shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#0A0A0B] pt-2 border-t border-[#D4D4CE]">
                <span>Estimated Total</span>
                <span>${calc.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onViewFullCart}
                className="py-3 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8]"
              >
                Full Bag View
              </button>
              <button
                type="button"
                onClick={onProceedToCheckout}
                className="py-3 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e1ff3d] flex items-center justify-center gap-1.5"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CheckoutViewProps {
  items: CartItem[];
  coupons: Coupon[];
  promoCode: string;
  savedAddresses: ShippingAddress[];
  currentUserEmail?: string;
  currentUserName?: string;
  onApplyPromoCode: (code: string) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onPlaceOrder: (orderPayload: {
    shippingAddress: ShippingAddress;
    shippingMethod: ShippingMethodType;
    paymentMethod: PaymentMethodType;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    taxAmount: number;
    totalAmount: number;
    promoCode?: string;
  }) => Promise<void>;
  onContinueShopping: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  coupons,
  promoCode,
  savedAddresses,
  currentUserEmail,
  currentUserName,
  onApplyPromoCode,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onContinueShopping,
}) => {
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'member'>('member');
  const [recipientName, setRecipientName] = useState(
    currentUserName || defaultAddr?.recipientName || 'Elena Rostova'
  );
  const [email, setEmail] = useState(
    currentUserEmail || defaultAddr?.email || 'elena.rostova@aura-atelier.com'
  );
  const [phone, setPhone] = useState(defaultAddr?.phone || '+1 (212) 555-0194');
  const [street, setStreet] = useState(
    defaultAddr?.street || '458 Broome Street, Penthouse 4B'
  );
  const [city, setCity] = useState(defaultAddr?.city || 'New York');
  const [stateProv, setStateProv] = useState(defaultAddr?.state || 'NY');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '10013');
  const [country, setCountry] = useState(defaultAddr?.country || 'United States');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [cardNumber, setCardNumber] = useState('4532 8910 4421 8894');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('842');
  const [promoInput, setPromoInput] = useState(promoCode);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calc = calculateCartTotals(items, coupons, promoCode, shippingMethod);

  const handleSelectSavedAddress = (addr: ShippingAddress) => {
    setRecipientName(addr.recipientName);
    setEmail(addr.email);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setStateProv(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setFormErrors({});
  };

  const handleClearForGuest = () => {
    setCheckoutMode('guest');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCheckoutForm(
      {
        recipientName,
        email,
        phone,
        street,
        city,
        state: stateProv,
        postalCode,
        country,
        cardNumber,
        cardExpiry,
        cardCvc,
      },
      paymentMethod
    );

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        shippingAddress: {
          id: `addr-${Date.now()}`,
          label: checkoutMode === 'guest' ? 'Guest Delivery' : 'Primary Delivery',
          recipientName: recipientName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: stateProv.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        shippingMethod,
        paymentMethod,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        shippingCost: calc.shippingCost,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
        promoCode: calc.appliedCoupon?.code,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-5">
        <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-[#6E6E73]">
          Add garments from the permanent archive before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="px-6 py-3 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-10">
      <div className="border-b border-[#E4E4E0] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#6E6E73]">Encrypted Atelier Checkout</p>
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B] mt-1">
            Bag Review & Dispatch Details
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
          <Lock className="w-3.5 h-3.5 text-[#0A0A0B]" />
          <span>PCI-DSS Compliant 256-Bit TLS Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 7 Columns: Checkout Form */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-8" noValidate>
          {/* Guest vs Member Switcher */}
          <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0A0A0B]">
                01. Client Mode & Saved Addresses
              </h2>
              <div className="flex items-center gap-1 p-1 bg-[#E4E4E0]">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('member')}
                  className={`px-3 py-1 text-xs font-medium ${
                    checkoutMode === 'member'
                      ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                      : 'text-[#6E6E73]'
                  }`}
                >
                  Atelier Member
                </button>
                <button
                  type="button"
                  onClick={handleClearForGuest}
                  className={`px-3 py-1 text-xs font-medium ${
                    checkoutMode === 'guest'
                      ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                      : 'text-[#6E6E73]'
                  }`}
                >
                  Guest Checkout
                </button>
              </div>
            </div>

            {checkoutMode === 'member' && savedAddresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className="text-left p-3.5 bg-[#F9F9F8] border border-[#D4D4CE] hover:border-[#0A0A0B] transition-colors space-y-1"
                  >
                    <p className="text-xs font-semibold text-[#0A0A0B]">
                      {addr.label} · {addr.recipientName}
                    </p>
                    <p className="text-xs text-[#6E6E73]">
                      {addr.street}, {addr.city} {addr.postalCode}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Destination Form */}
          <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#0A0A0B]">
              02. Shipping Address & Courier Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
                {formErrors.recipientName && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.recipientName}</p>
                )}
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Email for Receipt & Tracking *
                </label>
                <input
                  id="chk-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
                {formErrors.email && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-phone" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Courier Contact Phone *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
                {formErrors.phone && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="chk-country" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Destination Country *
                </label>
                <input
                  id="chk-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
                {formErrors.country && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.country}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="chk-street" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                Street Address & Suite *
              </label>
              <input
                id="chk-street"
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
              {formErrors.street && (
                <p className="text-xs text-[#DC2626] mt-1">{formErrors.street}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="chk-city" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  City *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
                {formErrors.city && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.city}</p>
                )}
              </div>
              <div>
                <label htmlFor="chk-state" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  State / Province
                </label>
                <input
                  id="chk-state"
                  type="text"
                  value={stateProv}
                  onChange={(e) => setStateProv(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="chk-zip" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Postal / ZIP Code *
                </label>
                <input
                  id="chk-zip"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F9F9F8] border border-[#D4D4CE] font-mono"
                />
                {formErrors.postalCode && (
                  <p className="text-xs text-[#DC2626] mt-1">{formErrors.postalCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Method Selector */}
          <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#0A0A0B] flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>03. Dispatch Speed</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'standard' as ShippingMethodType,
                  name: 'Standard Courier',
                  eta: '4–6 Business Days',
                  price: calc.subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '$18',
                },
                {
                  id: 'express' as ShippingMethodType,
                  name: 'DHL Express Air',
                  eta: '2–3 Business Days',
                  price: calc.subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '$25',
                },
                {
                  id: 'atelier_courier' as ShippingMethodType,
                  name: 'White-Glove Garment Bag',
                  eta: 'Next-Day Priority',
                  price: '$35',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setShippingMethod(opt.id)}
                  className={`p-3.5 text-left border transition-colors ${
                    shippingMethod === opt.id
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                      : 'bg-[#F9F9F8] text-[#0A0A0B] border-[#D4D4CE]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{opt.name}</span>
                    <span className="font-mono">{opt.price}</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      shippingMethod === opt.id ? 'text-[#D4D4D8]' : 'text-[#6E6E73]'
                    }`}
                  >
                    {opt.eta}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#0A0A0B] flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>04. Payment Method</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'card' as PaymentMethodType, label: 'Credit / Debit Card' },
                { id: 'express_pay' as PaymentMethodType, label: 'Apple / Express Pay' },
                { id: 'paypal' as PaymentMethodType, label: 'PayPal Express' },
                { id: 'cod' as PaymentMethodType, label: 'Cash on Delivery' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-2.5 px-3 text-xs font-medium border transition-colors ${
                    paymentMethod === pm.id
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                      : 'bg-[#F9F9F8] text-[#0A0A0B] border-[#D4D4CE]'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                <div className="sm:col-span-6">
                  <label htmlFor="card-num" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                    Card Number
                  </label>
                  <input
                    id="card-num"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                  />
                  {formErrors.cardNumber && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.cardNumber}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="card-exp" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="card-exp"
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                  />
                  {formErrors.cardExpiry && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.cardExpiry}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="card-cvc" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                    CVC
                  </label>
                  <input
                    id="card-cvc"
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                  />
                  {formErrors.cardCvc && (
                    <p className="text-xs text-[#DC2626] mt-1">{formErrors.cardCvc}</p>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <p className="text-xs text-[#6E6E73] bg-[#F9F9F8] p-3 border border-[#D4D4CE]">
                Cash on Delivery (COD) is available for verified residential and studio addresses.
                Total due upon courier signature:{' '}
                <strong className="font-mono text-[#0A0A0B]">
                  ${calc.totalAmount.toFixed(2)} USD
                </strong>
                .
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 text-sm font-semibold bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#D4FF00] hover:text-[#0A0A0B] transition-colors flex items-center justify-center gap-2"
          >
            <span>
              {isSubmitting
                ? 'Authorizing Atelier Dispatch...'
                : `Complete Order — $${calc.totalAmount.toFixed(2)} USD`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Right 5 Columns: Persistent Bag & Promo Summary */}
        <aside className="lg:col-span-5 bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-[#0A0A0B] border-b border-[#E4E4E0] pb-3">
            Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} Pieces)
          </h2>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex items-center justify-between gap-3 bg-[#F9F9F8] p-3 border border-[#E4E4E0]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 bg-[#E5E4DF] shrink-0 overflow-hidden">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0A0A0B]">{item.name}</p>
                    <p className="text-[11px] text-[#6E6E73]">
                      {item.colorName} · Size {item.size}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                        className="text-xs px-1.5 border border-[#D4D4CE]"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                        className="text-xs px-1.5 border border-[#D4D4CE]"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.variantId)}
                        className="text-[11px] text-[#6E6E73] hover:text-[#DC2626] ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#0A0A0B]">
                  ${(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Promo Code Box */}
          <div className="pt-4 border-t border-[#E4E4E0] space-y-2">
            <label htmlFor="chk-promo" className="block text-xs font-medium text-[#0A0A0B]">
              Privilege / Promo Code
            </label>
            <div className="flex gap-2">
              <input
                id="chk-promo"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="AURA20, WELCOME10, ATELIER100"
                className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#F9F9F8] border border-[#D4D4CE]"
              />
              <button
                type="button"
                onClick={() => onApplyPromoCode(promoInput)}
                className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Apply Code
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {coupons
                .filter((c) => c.active)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setPromoInput(c.code);
                      onApplyPromoCode(c.code);
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 bg-[#F9F9F8] border border-[#D4D4CE] text-[#0A0A0B] hover:border-[#0A0A0B] flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{c.code}</span>
                  </button>
                ))}
            </div>
            {calc.promoError && (
              <p className="text-xs text-[#DC2626]">{calc.promoError}</p>
            )}
            {calc.appliedCoupon && (
              <p className="text-xs text-[#16A34A] font-medium">
                ✓ {calc.appliedCoupon.code} applied ({calc.appliedCoupon.description})
              </p>
            )}
          </div>

          {/* Totals Breakdown */}
          <div className="pt-4 border-t border-[#E4E4E0] space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-[#6E6E73]">
              <span>Subtotal</span>
              <span>${calc.subtotal.toFixed(2)}</span>
            </div>
            {calc.discountAmount > 0 && (
              <div className="flex justify-between text-[#16A34A]">
                <span>Privilege Discount ({calc.appliedCoupon?.code})</span>
                <span>-${calc.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6E6E73]">
              <span>Courier Shipping</span>
              <span>{calc.shippingCost === 0 ? 'FREE' : `$${calc.shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-[#6E6E73]">
              <span>Estimated Duties & Tax (8%)</span>
              <span>${calc.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#0A0A0B] pt-3 border-t border-[#0A0A0B]">
              <span>Total Due</span>
              <span>${calc.totalAmount.toFixed(2)} USD</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

interface OrderConfirmationViewProps {
  order: OrderRecord;
  onContinueShopping: () => void;
  onViewOrderHistory: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onContinueShopping,
  onViewOrderHistory,
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div className="bg-[#0A0A0B] text-[#F9F9F8] p-8 sm:p-10 border border-[#242428] space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#D4FF00]">
          <CheckCircle2 className="w-4 h-4" />
          <span>ORDER CONFIRMED · PREPARING MILAN ATELIER DISPATCH</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#242428] pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Thank You, {order.customerName}
            </h1>
            <p className="text-sm text-[#B4B4BB] mt-1">
              Confirmation & digital garment dossier sent to{' '}
              <span className="text-[#F9F9F8] underline">{order.customerEmail}</span>
            </p>
          </div>
          <div className="text-left sm:text-right font-mono tabular-nums">
            <p className="text-xs text-[#9E9EA4]">Order Reference</p>
            <p className="text-lg font-semibold text-[#D4FF00]">{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <p className="text-[#9E9EA4]">Shipping Destination</p>
            <p className="font-semibold text-[#F9F9F8] mt-1">
              {order.shippingAddress.recipientName}
            </p>
            <p className="text-[#B4B4BB]">
              {order.shippingAddress.street}, {order.shippingAddress.city}{' '}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-[#B4B4BB]">{order.shippingAddress.country}</p>
          </div>
          <div>
            <p className="text-[#9E9EA4]">Courier & Tracking</p>
            <p className="font-mono text-[#F9F9F8] font-semibold mt-1">
              {order.trackingNumber}
            </p>
            <p className="text-[#B4B4BB]">{order.estimatedDelivery}</p>
          </div>
          <div>
            <p className="text-[#9E9EA4]">Payment & Status</p>
            <p className="font-semibold text-[#F9F9F8] uppercase mt-1">
              {order.paymentMethod.replace('_', ' ')} · {order.status}
            </p>
            <p className="font-mono tabular-nums text-[#D4FF00]">
              Total Paid: ${order.totalAmount.toFixed(2)} USD
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmailModal((v) => !v)}
            className="px-4 py-2.5 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{showEmailModal ? 'Hide Confirmation Email' : 'Preview Confirmation Email'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 text-xs font-medium border border-[#3A3A40] text-[#F9F9F8] hover:border-[#F9F9F8] flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Tax Invoice</span>
          </button>
          <button
            type="button"
            onClick={onViewOrderHistory}
            className="px-4 py-2.5 text-xs font-medium border border-[#3A3A40] text-[#F9F9F8] hover:border-[#F9F9F8]"
          >
            Track in Account Portal
          </button>
          <button
            type="button"
            onClick={onContinueShopping}
            className="px-4 py-2.5 text-xs font-medium text-[#B4B4BB] hover:text-[#F9F9F8] underline"
          >
            Return to Storefront
          </button>
        </div>
      </div>

      {/* Simulated Interactive Confirmation Email Preview */}
      {showEmailModal && (
        <div className="bg-[#F1F0EC] border border-[#0A0A0B] p-6 sm:p-8 space-y-4">
          <div className="border-b border-[#D4D4CE] pb-3 text-xs font-mono space-y-1">
            <p>
              <strong>From:</strong> AURA ATELIER Concierge &lt;concierge@aura-atelier.com&gt;
            </p>
            <p>
              <strong>To:</strong> {order.customerName} &lt;{order.customerEmail}&gt;
            </p>
            <p>
              <strong>Subject:</strong> Your AURA ATELIER Order {order.orderNumber} is Confirmed
            </p>
          </div>
          <div className="text-xs text-[#0A0A0B] space-y-3 leading-relaxed">
            <p>Dear {order.customerName},</p>
            <p>
              Thank you for your acquisition from AURA ATELIER. Our Milanese fulfillment studio is
              currently inspecting and steaming your garments prior to sealed courier dispatch via
              tracking number <strong className="font-mono">{order.trackingNumber}</strong>.
            </p>
            <div className="p-4 bg-[#F9F9F8] border border-[#E4E4E0] font-mono tabular-nums space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.productName} ({item.colorName} / {item.size})
                  </span>
                  <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-[#E4E4E0] pt-2 mt-2 flex justify-between font-semibold">
                <span>Total Charged</span>
                <span>${order.totalAmount.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
