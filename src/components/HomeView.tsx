import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductCategory } from '../types/commerce';
import {
  HERO_CAMPAIGN_IMAGE,
  IMG_OUTERWEAR_COAT,
  IMG_KNITWEAR_MERINO,
  IMG_TAILORING_TROUSERS,
  IMG_SILK_SHIRT,
} from '../data/seedCatalog';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

interface HomeViewProps {
  products: Product[];
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigateShop: (preset?: { category?: string; searchQuery?: string }) => void;
  onNavigateStatic: (page: 'about' | 'size-guide' | 'shipping-returns') => void;
  onSubscribeNewsletter: (email: string) => Promise<string>;
}

const HERO_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'Autumn / Winter 2026 Architectural Capsule',
    title: 'Sculptural Tailoring in Double-Faced Cashmere & Wool',
    description:
      'Constructed in Milan and Biella from traceable natural fibers. Designed for modern professionals who demand permanence over seasonal noise.',
    ctaLabel: 'Explore the Collection',
    categoryFilter: 'All',
    image: HERO_CAMPAIGN_IMAGE,
    metric: '620 GSM Biella Virgin Wool · Unlined Hand-Finished Seams',
  },
  {
    id: 'slide-2',
    kicker: '01. Outerwear Architecture',
    title: 'The Monolith Overcoat & Storm-Proof Swiss Ventile',
    description:
      'Engineered to move effortlessly over structured tailoring with natural weather protection and weightless thermal balance.',
    ctaLabel: 'Shop Outerwear',
    categoryFilter: 'Outerwear',
    image: IMG_OUTERWEAR_COAT,
    metric: '100% Traceable Italian & Swiss Mills · Complimentary Express Courier',
  },
  {
    id: 'slide-3',
    kicker: '02. Tactile Knitwear & Como Silk',
    title: '5-Gauge ZQ Merino & 22-Momme Mulberry Silk',
    description:
      'Heavyweight Fisherman rib knitwear paired with liquid organic silk shirting—crafted to anchor your daily uniform.',
    ctaLabel: 'Shop Knitwear',
    categoryFilter: 'Knitwear',
    image: IMG_KNITWEAR_MERINO,
    metric: '18.5-Micron Extrafine Merino · GOTS-Certified Organic Silk',
  },
];

const COLLECTION_CARDS: {
  category: ProductCategory;
  title: string;
  subtitle: string;
  countLabel: string;
  image: string;
}[] = [
  {
    category: 'Outerwear',
    title: 'Architectural Outerwear',
    subtitle: 'Double-faced wool overcoats & Swiss Ventile trenches',
    countLabel: 'Biella & Zurich Mills',
    image: IMG_OUTERWEAR_COAT,
  },
  {
    category: 'Knitwear',
    title: 'Fine Gauge Knitwear',
    subtitle: '5-gauge ZQ merino turtlenecks & Scottish cashmere',
    countLabel: 'Bergamo & Hawick',
    image: IMG_KNITWEAR_MERINO,
  },
  {
    category: 'Tailoring',
    title: 'Precision Tailoring',
    subtitle: 'High-twist wool gabardine trousers & canvas blazers',
    countLabel: 'Naples & Huddersfield',
    image: IMG_TAILORING_TROUSERS,
  },
  {
    category: 'Silk & Shirts',
    title: 'Como Silk & Swiss Poplin',
    subtitle: '22-momme organic Mulberry silk & 120/2 Alumo shirts',
    countLabel: 'Como & Appenzell',
    image: IMG_SILK_SHIRT,
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  wishlistIds,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
  onNavigateShop,
  onNavigateStatic,
  onSubscribeNewsletter,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showcaseTab, setShowcaseTab] = useState<'featured' | 'new' | 'bestsellers'>('featured');
  const [predictiveQuery, setPredictiveQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterFeedback, setNewsletterFeedback] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const slide = HERO_SLIDES[activeSlide];

  const showcaseProducts = products
    .filter((p) => {
      if (showcaseTab === 'new') return p.isNewArrival;
      if (showcaseTab === 'bestsellers') return p.isBestSeller;
      return p.featured;
    })
    .slice(0, 6);

  const predictiveMatches =
    predictiveQuery.trim().length >= 2
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(predictiveQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(predictiveQuery.toLowerCase()) ||
              p.fabric.toLowerCase().includes(predictiveQuery.toLowerCase())
          )
          .slice(0, 4)
      : [];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);
    setNewsletterFeedback(null);
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }
    try {
      const msg = await onSubscribeNewsletter(newsletterEmail.trim());
      setNewsletterFeedback(msg);
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterError(err instanceof Error ? err.message : 'Subscription failed.');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Section 1: Storefront Hero Showcase + Predictive Search Utility Bar */}
      <section className="bg-[#0A0A0B] text-[#F9F9F8] border-b border-[#242428]">
        <div className="max-w-[1360px] mx-auto px-6 py-6 border-b border-[#242428] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Predictive Search Input */}
          <div className="relative flex-1 max-w-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onNavigateShop({ searchQuery: predictiveQuery });
              }}
              className="flex items-center bg-[#141416] border border-[#2E2E32] focus-within:border-[#D4FF00]"
            >
              <Search className="w-4 h-4 text-[#9E9EA4] ml-3.5 shrink-0" />
              <input
                type="search"
                value={predictiveQuery}
                onChange={(e) => setPredictiveQuery(e.target.value)}
                placeholder="Search garments, Italian merino, Mulberry silk, coats..."
                aria-label="Search garments and fabrics"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-[#F9F9F8] placeholder-[#8E8E94] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-medium bg-[#242428] text-[#F9F9F8] hover:bg-[#D4FF00] hover:text-[#0A0A0B] transition-colors whitespace-nowrap shrink-0"
              >
                Search Catalog
              </button>
            </form>

            {predictiveMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#141416] border border-[#2E2E32] z-30 shadow-2xl divide-y divide-[#242428]">
                {predictiveMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      setPredictiveQuery('');
                      onSelectProduct(match);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left hover:bg-[#1E1E22] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F9F9F8]">{match.name}</p>
                      <p className="text-xs text-[#9E9EA4]">
                        {match.category} · {match.fabric}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs text-[#D4FF00]">
                      ${match.price}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-[#A0A0A6] overflow-x-auto">
            <span>Complimentary Express Courier on orders $250+</span>
            <span aria-hidden="true">·</span>
            <span>Code AURA20 for 20% off $400+</span>
          </div>
        </div>

        {/* Split Hero Grid */}
        <div className="max-w-[1360px] mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-mono tracking-wider text-[#D4FF00]">
                {slide.kicker}
              </p>
              <h1
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F9F9F8] leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                {slide.title}
              </h1>
              <p className="text-base text-[#B4B4BB] leading-relaxed max-w-[58ch]">
                {slide.description}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    onNavigateShop(
                      slide.categoryFilter !== 'All'
                        ? { category: slide.categoryFilter }
                        : undefined
                    )
                  }
                  className="px-6 py-3.5 text-sm font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e2ff4d] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>{slide.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateStatic('about')}
                  className="px-5 py-3.5 text-sm font-medium border border-[#3A3A40] text-[#F9F9F8] hover:border-[#F9F9F8] transition-colors whitespace-nowrap shrink-0"
                >
                  Our Milanese Atelier
                </button>
              </div>

              <div className="pt-6 border-t border-[#242428] flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-mono text-[#9E9EA4]">{slide.metric}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                    }
                    aria-label="Previous campaign slide"
                    className="w-9 h-9 flex items-center justify-center border border-[#2E2E32] text-[#F9F9F8] hover:border-[#D4FF00]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono tabular-nums text-xs text-[#9E9EA4] px-2">
                    0{activeSlide + 1} / 0{HERO_SLIDES.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                    aria-label="Next campaign slide"
                    className="w-9 h-9 flex items-center justify-center border border-[#2E2E32] text-[#F9F9F8] hover:border-[#D4FF00]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:min-h-[440px] bg-[#141416] border border-[#242428] overflow-hidden">
            <ResilientImage
              src={slide.image}
              alt={slide.title}
              priority
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex items-end p-6">
              <div className="flex items-center justify-between w-full text-xs text-[#F9F9F8]">
                <span>Look 0{activeSlide + 1} — Milan Concrete Gallery</span>
                <button
                  type="button"
                  onClick={() => onSelectProduct(products[activeSlide % products.length])}
                  className="underline hover:text-[#D4FF00] whitespace-nowrap shrink-0"
                >
                  Inspect Featured Garment →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Trust & Provenance Strip Below Hero Split */}
        <div className="border-t border-[#242428] bg-[#101012]">
          <div className="max-w-[1360px] mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#F9F9F8]">Complimentary Express Courier</p>
                <p className="text-[#9E9EA4] mt-0.5">Free DHL Express worldwide on orders over $250</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#F9F9F8]">30-Day Atelier Returns</p>
                <p className="text-[#9E9EA4] mt-0.5">Complimentary courier pickup & instant size exchange</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#F9F9F8]">Traceable European Mills</p>
                <p className="text-[#9E9EA4] mt-0.5">ZQ-certified merino, GOTS silk & Biella virgin wool</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#F9F9F8]">256-Bit Encrypted Checkout</p>
                <p className="text-[#9E9EA4] mt-0.5">Card, Express Pay, PayPal & Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Curated Capsule Collections */}
      <section className="max-w-[1360px] mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E4E0] pb-5">
          <div>
            <p className="text-xs text-[#6E6E73]">01. Architectural Wardrobe System</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0B] mt-1">
              Curated Capsule Collections
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateShop()}
            className="text-sm font-medium text-[#0A0A0B] hover:underline flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>View All {products.length} Garments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLLECTION_CARDS.map((col) => (
            <button
              key={col.category}
              type="button"
              onClick={() => onNavigateShop({ category: col.category })}
              className="group text-left bg-[#F1F0EC] border border-[#E4E4E0] flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#E5E4DF]">
                <ResilientImage
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 w-full">
                <p className="text-xs text-[#6E6E73]">{col.countLabel}</p>
                <h3 className="text-base font-semibold text-[#0A0A0B] mt-1 group-hover:underline">
                  {col.title}
                </h3>
                <p className="text-xs text-[#6E6E73] mt-1 line-clamp-2">{col.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Featured Garments / New Arrivals / Best Sellers Grid */}
      <section className="max-w-[1360px] mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4E4E0] pb-5">
          <div>
            <p className="text-xs text-[#6E6E73]">02. Permanent Edition</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0B] mt-1">
              Atelier Selection
            </h2>
          </div>

          {/* Interactive segmented filter control */}
          <div className="flex items-center gap-1 p-1 bg-[#EAE9E4] border border-[#DFDFD9] self-start">
            <button
              type="button"
              onClick={() => setShowcaseTab('featured')}
              className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showcaseTab === 'featured'
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              Featured Pieces
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('new')}
              className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showcaseTab === 'new'
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('bestsellers')}
              className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showcaseTab === 'bestsellers'
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              Best Sellers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onSelectProduct={onSelectProduct}
              onQuickAdd={onQuickAdd}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Craftsmanship Proof & Private Journal Newsletter */}
      <section className="max-w-[1360px] mx-auto px-6">
        <div className="bg-[#0A0A0B] text-[#F9F9F8] border border-[#242428] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-mono text-[#D4FF00]">
              03. Material Transparency & Private Journal
            </p>
            <h2
              className="font-display text-2xl sm:text-4xl font-bold tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Engineered to Outlast Micro-Seasons. Join the Private Atelier Dispatch.
            </h2>
            <p className="text-sm text-[#B4B4BB] leading-relaxed max-w-[62ch]">
              Receive early access to small-batch Biella wool releases, private showroom appointments
              in Milan, New York, and Zurich, and 10% off your first order with code{' '}
              <span className="font-mono text-[#D4FF00]">WELCOME10</span>.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#9E9EA4]">
              <button
                type="button"
                onClick={() => onNavigateStatic('size-guide')}
                className="underline hover:text-[#F9F9F8]"
              >
                Inspect Garment Measurement Matrix →
              </button>
              <button
                type="button"
                onClick={() => onNavigateStatic('shipping-returns')}
                className="underline hover:text-[#F9F9F8]"
              >
                Global Courier & Return Policy →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleNewsletterSubmit} className="space-y-3" noValidate>
              <label
                htmlFor="newsletter-email-input"
                className="block text-xs font-medium text-[#D4D4D8]"
              >
                Client Email Address
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="newsletter-email-input"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="client@domain.com"
                  className="flex-1 bg-[#141416] border border-[#2E2E32] px-4 py-3 text-sm text-[#F9F9F8] placeholder-[#6E6E73] focus:outline-none focus:border-[#D4FF00]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e3ff4d] transition-colors whitespace-nowrap shrink-0"
                >
                  Request Invitation
                </button>
              </div>
              {newsletterError && (
                <p className="text-xs text-[#F87171]" role="alert">
                  {newsletterError}
                </p>
              )}
              {newsletterFeedback && (
                <p className="text-xs text-[#D4FF00] flex items-center gap-1.5" role="status">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{newsletterFeedback}</span>
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
