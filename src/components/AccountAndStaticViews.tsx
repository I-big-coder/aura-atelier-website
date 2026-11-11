import React, { useState } from 'react';
import {
  Package,
  MapPin,
  Heart,
  User,
  KeyRound,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';
import {
  OrderRecord,
  ShippingAddress,
  Product,
  StaticPageKey,
} from '../types/commerce';
import { ProductCard } from './ProductCard';

interface AccountPortalViewProps {
  user: {
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: 'customer' | 'admin';
    isFirebaseUser?: boolean;
  };
  orders: OrderRecord[];
  addresses: ShippingAddress[];
  wishlistProducts: Product[];
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSwitchDemoRole: (role: 'customer' | 'admin') => void;
  onUpdateProfile: (patch: { name: string; email: string; phone: string }) => void;
  onAddAddress: (addr: Omit<ShippingAddress, 'id'>) => void;
  onDeleteAddress: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const AccountPortalView: React.FC<AccountPortalViewProps> = ({
  user,
  orders,
  addresses,
  wishlistProducts,
  onGoogleSignIn,
  onSignOut,
  onSwitchDemoRole,
  onUpdateProfile,
  onAddAddress,
  onDeleteAddress,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'addresses' | 'wishlist' | 'profile' | 'security'
  >('orders');

  // Profile form state
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // New Address state
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('United States');
  const [addrError, setAddrError] = useState<string | null>(null);

  // Password Reset / Email Sign-In state
  const [resetEmail, setResetEmail] = useState(user.email);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel.trim() || !addrStreet.trim() || !addrCity.trim() || !addrZip.trim()) {
      setAddrError('Please complete label, street, city, and postal code.');
      return;
    }
    setAddrError(null);
    onAddAddress({
      label: addrLabel.trim(),
      recipientName: user.name,
      email: user.email,
      phone: user.phone,
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: addrZip.trim(),
      country: addrCountry.trim(),
      isDefault: addresses.length === 0,
    });
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity('');
    setAddrState('');
    setAddrZip('');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
      {/* Top Account Banner */}
      <div className="bg-[#0A0A0B] text-[#F9F9F8] p-6 sm:p-8 border border-[#242428] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-mono text-[#D4FF00]">
            AURA ATELIER PRIVATE CLIENT PORTAL · {user.role.toUpperCase()}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-[#9E9EA4] mt-1">
            {user.email} · {user.phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setAuthError(null);
              try {
                await onGoogleSignIn();
              } catch (err) {
                setAuthError(
                  err instanceof Error
                    ? err.message
                    : 'Google Sign-In popup was closed or blocked.'
                );
              }
            }}
            className="px-4 py-2.5 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e1ff3d]"
          >
            {user.isFirebaseUser ? 'Connected via Google Auth' : 'Sign In with Google OAuth'}
          </button>

          <button
            type="button"
            onClick={() =>
              onSwitchDemoRole(user.role === 'admin' ? 'customer' : 'admin')
            }
            className="px-4 py-2.5 text-xs font-medium border border-[#3A3A40] text-[#F9F9F8] hover:border-[#F9F9F8]"
          >
            Switch to {user.role === 'admin' ? 'Client View' : 'Atelier Director (Admin)'}
          </button>

          {user.isFirebaseUser && (
            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2.5 text-xs border border-[#3A3A40] text-[#9E9EA4] hover:text-[#F9F9F8] flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-[#F1F0EC] border border-[#0A0A0B] text-xs text-[#0A0A0B]">
          Note: {authError} Using active Atelier Client session ({user.email}).
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAE9E4] border border-[#DFDFD9]">
        {[
          { id: 'orders' as const, label: `Order History & Tracking (${orders.length})`, icon: Package },
          { id: 'addresses' as const, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
          { id: 'wishlist' as const, label: `Saved Wishlist (${wishlistProducts.length})`, icon: Heart },
          { id: 'profile' as const, label: 'Profile & Preferences', icon: User },
          { id: 'security' as const, label: 'Password Reset & Security', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-12 text-center">
              <p className="text-sm font-semibold text-[#0A0A0B]">No orders recorded yet.</p>
            </div>
          ) : (
            orders.map((ord) => {
              const steps = ['Processing', 'Shipped', 'Delivered'];
              const currentStepIdx = steps.indexOf(ord.status);
              return (
                <div
                  key={ord.id}
                  className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E4E0] pb-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#0A0A0B]">
                        {ord.orderNumber}
                      </p>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Placed {new Date(ord.createdAt).toLocaleDateString()} · Tracking:{' '}
                        <span className="font-mono text-[#0A0A0B]">{ord.trackingNumber}</span>
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-xs font-semibold text-[#0A0A0B]">
                        Status: {ord.status}
                      </span>
                      <p className="text-sm font-bold text-[#0A0A0B] mt-0.5">
                        ${ord.totalAmount.toFixed(2)} USD
                      </p>
                    </div>
                  </div>

                  {/* Live Order Tracking Stepper */}
                  {ord.status !== 'Refunded' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {steps.map((step, idx) => {
                        const completed = idx <= currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`p-2.5 border text-xs font-mono ${
                              completed
                                ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                                : 'bg-[#F9F9F8] text-[#6E6E73] border-[#D4D4CE]'
                            }`}
                          >
                            0{idx + 1}. {step}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2 text-xs font-mono tabular-nums">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-[#0A0A0B]">
                        <span>
                          {item.quantity}× {item.productName} ({item.colorName} · Size {item.size})
                        </span>
                        <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-[#F1F0EC] border border-[#E4E4E0] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0A0A0B]">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="font-mono text-[11px] text-[#6E6E73]">Default</span>
                    )}
                  </div>
                  <p className="text-[#0A0A0B] font-medium">{addr.recipientName}</p>
                  <p className="text-[#6E6E73]">{addr.street}</p>
                  <p className="text-[#6E6E73]">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-[#6E6E73]">{addr.country}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteAddress(addr.id)}
                  className="text-xs text-[#6E6E73] hover:text-[#DC2626] flex items-center gap-1 self-start"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Address</span>
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddAddressSubmit}
            className="lg:col-span-5 bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold text-[#0A0A0B] flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add New Shipping Destination</span>
            </h3>
            <div>
              <label htmlFor="addr-label" className="block text-xs font-medium mb-1">
                Address Label (e.g. Milan Office, Home)
              </label>
              <input
                id="addr-label"
                type="text"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>
            <div>
              <label htmlFor="addr-street" className="block text-xs font-medium mb-1">
                Street Address
              </label>
              <input
                id="addr-street"
                type="text"
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="addr-city" className="block text-xs font-medium mb-1">
                  City
                </label>
                <input
                  id="addr-city"
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="addr-zip" className="block text-xs font-medium mb-1">
                  Postal Code
                </label>
                <input
                  id="addr-zip"
                  type="text"
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="addr-state" className="block text-xs font-medium mb-1">
                  State / Region
                </label>
                <input
                  id="addr-state"
                  type="text"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="addr-country" className="block text-xs font-medium mb-1">
                  Country
                </label>
                <input
                  id="addr-country"
                  type="text"
                  value={addrCountry}
                  onChange={(e) => setAddrCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
            </div>
            {addrError && <p className="text-xs text-[#DC2626]">{addrError}</p>}
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
            >
              Save Destination
            </button>
          </form>
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-12 text-center space-y-3">
              <p className="font-display text-lg font-semibold text-[#0A0A0B]">
                Your Saved Wishlist is Empty
              </p>
              <p className="text-xs text-[#6E6E73]">
                Bookmark garments while browsing the archive to keep track of seasonal availability.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={true}
                  onSelectProduct={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateProfile({
              name: profileName.trim(),
              email: profileEmail.trim(),
              phone: profilePhone.trim(),
            });
            setProfileSavedToast(true);
          }}
          className="max-w-xl bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-[#0A0A0B]">
            Client Identity & Concierge Preferences
          </h3>
          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
            />
          </div>
          <div>
            <label htmlFor="prof-email" className="block text-xs font-medium mb-1">
              Email Address
            </label>
            <input
              id="prof-email"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block text-xs font-medium mb-1">
              Phone Number
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
            />
          </div>
          {profileSavedToast && (
            <p className="text-xs text-[#16A34A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated and synchronized with isolated private storage.</span>
            </p>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
          >
            Save Profile Changes
          </button>
        </form>
      )}

      {activeTab === 'security' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (resetEmail.trim()) setResetSent(true);
          }}
          className="max-w-xl bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-[#0A0A0B]">
            Password Reset & Account Recovery
          </h3>
          <p className="text-xs text-[#6E6E73]">
            Request a one-time cryptographic password recovery link or manage your Google OAuth
            session credentials.
          </p>
          <div>
            <label htmlFor="sec-email" className="block text-xs font-medium mb-1">
              Registered Account Email
            </label>
            <input
              id="sec-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
            />
          </div>
          {resetSent && (
            <p className="text-xs text-[#16A34A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password recovery dispatch sent to {resetEmail}.</span>
            </p>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
          >
            Send Password Reset Link
          </button>
        </form>
      )}
    </div>
  );
};

interface StaticPageViewProps {
  pageKey: StaticPageKey;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onSubmitContact: (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<void>;
}

const FAQ_ITEMS = [
  {
    q: 'Where are AURA ATELIER garments woven and tailored?',
    a: 'All virgin wool and cashmere outerwear fabrics are woven in Biella, Italy and tailored in Milan. Our 5-gauge merino knitwear is spun in Tollegno and knitted in Bergamo, while organic Mulberry silk is woven in Como.',
  },
  {
    q: 'How does your complimentary DHL Express shipping and return process work?',
    a: 'Orders above $250 USD qualify for complimentary insured DHL Express air delivery worldwide (2–4 business days). Every order includes a pre-paid return airway bill valid for 30 days from receipt.',
  },
  {
    q: 'Can I check out as a guest or pay via Cash on Delivery (COD)?',
    a: 'Yes. We support Guest Checkout as well as Member Checkout, with Credit/Debit Cards, Apple/Express Pay, PayPal, and Cash on Delivery (COD) for verified residential and studio addresses.',
  },
  {
    q: 'How should I care for double-faced unlined wool and 22-momme silk?',
    a: 'Double-faced wool coats should be brushed with a soft boar-bristle brush after wear and professionally dry cleaned once a season. 22-momme silk shirts may be hand-washed cold at 20°C with pH-neutral silk cleanser or dry cleaned.',
  },
];

export const StaticPageView: React.FC<StaticPageViewProps> = ({
  pageKey,
  onNavigateHome,
  onNavigateShop,
  onSubmitContact,
}) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Private Client Fitting & Sizing Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  if (pageKey === 'not-found') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-5">
        <p className="font-mono text-xs text-[#6E6E73]">HTTP 404 · ARCHIVE ENTRY NOT FOUND</p>
        <h1 className="font-display text-4xl font-bold text-[#0A0A0B]">
          The Requested Atelier Page Does Not Exist
        </h1>
        <p className="text-sm text-[#6E6E73]">
          The garment or editorial dossier you are looking for may have moved to the permanent archive.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
          >
            Return to Homepage
          </button>
          <button
            type="button"
            onClick={onNavigateShop}
            className="px-5 py-2.5 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B]"
          >
            Browse Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {pageKey === 'about' && (
        <div className="space-y-6">
          <p className="text-xs font-mono text-[#6E6E73]">01. ABOUT AURA ATELIER</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0A0A0B]">
            Architectural Minimalist Essentials Crafted for Modern Professionals
          </h1>
          <p className="text-sm text-[#6E6E73] leading-relaxed">
            Founded between Milan and Zurich, AURA ATELIER rejects disposable seasonal trends in
            favor of a permanent modular wardrobe. Every garment begins with traceable natural raw
            fibers—620gsm Biella double-faced virgin wool, 18.5-micron ZQ-certified extrafine
            merino, 22-momme GOTS organic Mulberry silk, and high-density Swiss Ventile cotton.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 bg-[#F1F0EC] border border-[#E4E4E0]">
              <p className="font-mono text-xl font-bold text-[#0A0A0B]">100%</p>
              <p className="text-xs text-[#6E6E73] mt-1">
                Traceable European partner mills in Biella, Como, Huddersfield & Appenzell
              </p>
            </div>
            <div className="p-5 bg-[#F1F0EC] border border-[#E4E4E0]">
              <p className="font-mono text-xl font-bold text-[#0A0A0B]">Zero</p>
              <p className="text-xs text-[#6E6E73] mt-1">
                Virgin polyester or synthetic blends across our entire garment line
              </p>
            </div>
            <div className="p-5 bg-[#F1F0EC] border border-[#E4E4E0]">
              <p className="font-mono text-xl font-bold text-[#0A0A0B]">Lifetime</p>
              <p className="text-xs text-[#6E6E73] mt-1">
                Complimentary button, seam, and horn hardware repair at our partner ateliers
              </p>
            </div>
          </div>
        </div>
      )}

      {pageKey === 'contact' && (
        <div className="space-y-6">
          <p className="text-xs font-mono text-[#6E6E73]">CLIENT CONCIERGE & SHOWROOMS</p>
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            Contact the Atelier Concierge
          </h1>
          <p className="text-sm text-[#6E6E73]">
            Milan Flagship: Via Solferino 18, 20121 Milano · New York Showroom: 458 Broome Street,
            SoHo · Direct Concierge: +39 02 9475 8820
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
                setContactError('Please complete your name, email, and message.');
                return;
              }
              setContactError(null);
              await onSubmitContact({
                name: contactName.trim(),
                email: contactEmail.trim(),
                subject: contactSubject,
                message: contactMessage.trim(),
              });
              setContactSent(true);
              setContactName('');
              setContactMessage('');
            }}
            className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cnt-name" className="block text-xs font-medium mb-1">
                  Your Name *
                </label>
                <input
                  id="cnt-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="cnt-email" className="block text-xs font-medium mb-1">
                  Email Address *
                </label>
                <input
                  id="cnt-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cnt-subj" className="block text-xs font-medium mb-1">
                Inquiry Topic
              </label>
              <input
                id="cnt-subj"
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>
            <div>
              <label htmlFor="cnt-msg" className="block text-xs font-medium mb-1">
                Message *
              </label>
              <textarea
                id="cnt-msg"
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>
            {contactError && <p className="text-xs text-[#DC2626]">{contactError}</p>}
            {contactSent && (
              <p className="text-xs text-[#16A34A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your inquiry has been logged with our Milan Client Concierge.</span>
              </p>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
            >
              Send Dispatch
            </button>
          </form>
        </div>
      )}

      {pageKey === 'faq' && (
        <div className="space-y-6">
          <p className="text-xs font-mono text-[#6E6E73]">FREQUENTLY ASKED QUESTIONS</p>
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            Client Service & Garment FAQ
          </h1>
          <div className="divide-y divide-[#E4E4E0] border border-[#E4E4E0] bg-[#F1F0EC]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="p-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold text-[#0A0A0B]"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs text-[#6E6E73] leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pageKey === 'shipping-returns' && (
        <div className="space-y-5 text-xs text-[#6E6E73] leading-relaxed">
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            Global Courier Shipping & 30-Day Returns Policy
          </h1>
          <p>
            <strong className="text-[#0A0A0B]">Complimentary Express Delivery:</strong> All orders
            exceeding $250 USD ship free via DHL Express Worldwide with full insurance and
            signature confirmation. Orders placed before 14:00 CET dispatch the same business day.
          </p>
          <p>
            <strong className="text-[#0A0A0B]">30-Day Hassle-Free Returns & Exchanges:</strong>{' '}
            Unworn garments with original security tags and garment bags may be returned or
            exchanged within 30 days of delivery. Refunds are credited to the original payment
            method within 48 hours of inspection.
          </p>
        </div>
      )}

      {pageKey === 'size-guide' && (
        <div className="space-y-6">
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            Comprehensive Atelier Size & Fit Guide
          </h1>
          <p className="text-xs text-[#6E6E73]">
            Our garments are cut to European architectural blocks. Use the conversion matrix below
            to match your chest, shoulder, and waist measurements.
          </p>
          <div className="overflow-x-auto bg-[#F1F0EC] border border-[#E4E4E0] p-6">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-[#0A0A0B] text-[#0A0A0B]">
                  <th className="py-2 pr-4">Atelier Size</th>
                  <th className="py-2 px-4">IT / EU</th>
                  <th className="py-2 px-4">US / UK</th>
                  <th className="py-2 px-4">Chest (cm)</th>
                  <th className="py-2 pl-4">Waist (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0] text-[#6E6E73]">
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">XS</td>
                  <td className="py-2.5 px-4">44</td>
                  <td className="py-2.5 px-4">34</td>
                  <td className="py-2.5 px-4">88–92</td>
                  <td className="py-2.5 pl-4">72–76</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">S</td>
                  <td className="py-2.5 px-4">46</td>
                  <td className="py-2.5 px-4">36</td>
                  <td className="py-2.5 px-4">93–97</td>
                  <td className="py-2.5 pl-4">77–81</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">M</td>
                  <td className="py-2.5 px-4">48</td>
                  <td className="py-2.5 px-4">38</td>
                  <td className="py-2.5 px-4">98–102</td>
                  <td className="py-2.5 pl-4">82–86</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">L</td>
                  <td className="py-2.5 px-4">50</td>
                  <td className="py-2.5 px-4">40</td>
                  <td className="py-2.5 px-4">103–108</td>
                  <td className="py-2.5 pl-4">87–92</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#0A0A0B]">XL</td>
                  <td className="py-2.5 px-4">52</td>
                  <td className="py-2.5 px-4">42</td>
                  <td className="py-2.5 px-4">109–114</td>
                  <td className="py-2.5 pl-4">93–98</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(pageKey === 'privacy' || pageKey === 'terms') && (
        <div className="space-y-4 text-xs text-[#6E6E73] leading-relaxed">
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            {pageKey === 'privacy'
              ? 'Privacy Policy & GDPR Data Protection'
              : 'Terms of Service & Conditions of Sale'}
          </h1>
          <p>
            AURA ATELIER processes client personal data strictly in accordance with EU GDPR and
            Swiss Federal Data Protection Act standards. Customer PII (email, shipping address,
            telephone) is isolated within split-collection access controls (`{'/users/{uid}/private'}`)
            and encrypted in transit and at rest.
          </p>
          <p>
            All intellectual property, garment patterns, studio photography, and trademarks remain
            the exclusive property of AURA ATELIER S.r.l.
          </p>
        </div>
      )}

      {pageKey === 'setup-guide' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0A0A0B]">
            <Terminal className="w-4 h-4" />
            <span>DEVELOPER & DEPLOYMENT DOCUMENTATION</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#0A0A0B]">
            Local Development, Environment & Cloud Deployment Guide
          </h1>
          <div className="bg-[#0A0A0B] text-[#F9F9F8] p-6 font-mono text-xs space-y-4">
            <div>
              <p className="text-[#D4FF00]"># 1. Environment Variables (.env)</p>
              <pre className="text-[#B4B4BB] mt-1 overflow-x-auto">
{`APP_URL="http://localhost:3000"
GEMINI_API_KEY="your_api_key_if_needed"`}
              </pre>
            </div>
            <div>
              <p className="text-[#D4FF00]"># 2. Install & Run Full-Stack Locally (Port 3000)</p>
              <pre className="text-[#B4B4BB] mt-1 overflow-x-auto">
{`npm install
npm run dev        # Starts Express + Vite middleware on http://localhost:3000
npx tsx --test src/utils/commerceRules.test.ts  # Runs unit test suite`}
              </pre>
            </div>
            <div>
              <p className="text-[#D4FF00]"># 3. Production Build & Cloud Run / Firebase Deployment</p>
              <pre className="text-[#B4B4BB] mt-1 overflow-x-auto">
{`npm run build      # Compiles client bundle into dist/
npm start          # Runs production Express server (node server.ts)`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
