import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Ruler,
  ZoomIn,
  X,
  Star,
  CheckCircle2,
  Camera,
  Plus,
  Minus,
} from 'lucide-react';
import {
  Product,
  ProductReview,
  ProductVariant,
} from '../types/commerce';
import { ResilientImage } from './ResilientImage';
import { ProductCard } from './ProductCard';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  reviews: ProductReview[];
  wishlistIds: string[];
  onBackToCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number, buyNow?: boolean) => void;
  onToggleWishlist: (productId: string) => void;
  onSubmitReview: (review: {
    productId: string;
    authorName: string;
    rating: number;
    title: string;
    comment: string;
    photos: string[];
  }) => Promise<void>;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  reviews,
  wishlistIds,
  onBackToCatalog,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  onSubmitReview,
}) => {
  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.colorName, v])).values()
  );

  const [selectedColor, setSelectedColor] = useState<string>(
    uniqueColors[0]?.colorName || 'Obsidian Black'
  );
  const matchingColorVariants = product.variants.filter(
    (v) => v.colorName === selectedColor
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    matchingColorVariants[0]?.id || product.variants[0]?.id
  );
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [includeProductPhoto, setIncludeProductPhoto] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const firstColor = product.variants[0]?.colorName || 'Obsidian Black';
    setSelectedColor(firstColor);
    setSelectedVariantId(product.variants[0]?.id || '');
    setActiveImageIdx(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const currentVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    matchingColorVariants[0] ||
    product.variants[0];

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (a.category === product.category ? -1 : 1))
    .slice(0, 3);

  const isWishlisted = wishlistIds.includes(product.id);

  // Schema.org Product JSON-LD structured data
  const productSchemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: currentVariant?.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'AURA ATELIER',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability:
        (currentVariant?.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAvg,
      reviewCount: Math.max(1, product.reviewCount),
    },
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!reviewAuthor.trim() || !reviewTitle.trim() || reviewComment.trim().length < 5) {
      setReviewError('Please provide your name, a headline, and a detailed review comment.');
      return;
    }
    await onSubmitReview({
      productId: product.id,
      authorName: reviewAuthor.trim(),
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
      photos: includeProductPhoto ? [product.images[0]] : [],
    });
    setReviewAuthor('');
    setReviewTitle('');
    setReviewComment('');
    setReviewSuccess(true);
    setShowReviewForm(false);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productSchemaJson }}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-4 text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 text-[#0A0A0B] font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Archive</span>
          </button>
          <span aria-hidden="true">/</span>
          <span>{product.category}</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#0A0A0B] truncate max-w-[240px]">{product.name}</span>
        </div>
        <span className="font-mono text-[#6E6E73]">SKU: {currentVariant?.sku}</span>
      </div>

      {/* Primary Two-Column PDP Split: Sticky Gallery Left + Contiguous Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Multi-Angle Studio Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full bg-[#E8E7E2] border border-[#E4E4E0] overflow-hidden group">
            <ResilientImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={`${product.name} — View ${activeImageIdx + 1}`}
              priority
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              aria-label="Inspect high-resolution garment zoom"
              className="absolute bottom-4 right-4 px-3.5 py-2 bg-[#0A0A0B]/90 text-[#F9F9F8] text-xs font-medium flex items-center gap-1.5 hover:bg-[#D4FF00] hover:text-[#0A0A0B] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Studio Zoom</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {product.images.map((imgUrl, idx) => (
              <button
                key={`${imgUrl}-${idx}`}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                aria-label={`Select angle ${idx + 1}`}
                className={`aspect-[4/3] overflow-hidden border transition-all ${
                  activeImageIdx === idx
                    ? 'border-[#0A0A0B] ring-1 ring-[#0A0A0B]'
                    : 'border-[#E4E4E0] opacity-75 hover:opacity-100'
                }`}
              >
                <ResilientImage
                  src={imgUrl}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-[#F1F0EC] border border-[#E4E4E0] p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2 border-b border-[#E4E4E0] pb-5">
            <div className="flex items-center justify-between text-xs text-[#6E6E73]">
              <span>
                {product.category} · {product.origin}
              </span>
              <span className="font-mono tabular-nums text-[#0A0A0B]">
                ★ {product.ratingAvg.toFixed(1)} ({productReviews.length} reviews)
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0B]">
              {product.name}
            </h1>
            <p className="text-sm text-[#6E6E73]">{product.subtitle}</p>

            <div className="pt-2 flex items-baseline gap-3 font-mono tabular-nums">
              <span className="text-2xl font-semibold text-[#0A0A0B]">
                ${product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-[#6E6E73] line-through">
                  ${product.compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-[#6E6E73]">USD · Duties & Taxes Included</span>
            </div>
          </div>

          {/* Color Variant Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0A0A0B]">
                Shade: <span className="font-normal text-[#6E6E73]">{selectedColor}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {uniqueColors.map((cVar) => (
                <button
                  key={cVar.colorName}
                  type="button"
                  onClick={() => {
                    setSelectedColor(cVar.colorName);
                    const firstForColor = product.variants.find(
                      (v) => v.colorName === cVar.colorName
                    );
                    if (firstForColor) setSelectedVariantId(firstForColor.id);
                  }}
                  aria-label={`Select shade ${cVar.colorName}`}
                  className={`px-3 py-2 border text-xs flex items-center gap-2 transition-colors ${
                    selectedColor === cVar.colorName
                      ? 'border-[#0A0A0B] bg-[#0A0A0B] text-[#F9F9F8]'
                      : 'border-[#D4D4CE] bg-[#F9F9F8] text-[#0A0A0B] hover:border-[#0A0A0B]'
                  }`}
                >
                  <span
                    className="w-3 h-3 border border-black/20 shrink-0"
                    style={{ backgroundColor: cVar.colorHex }}
                  />
                  <span>{cVar.colorName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Variant Selector & Size Chart Trigger */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0A0A0B]">
                Size:{' '}
                <span className="font-mono font-normal text-[#6E6E73]">
                  {currentVariant?.size}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(true)}
                className="flex items-center gap-1 text-[#0A0A0B] underline hover:text-[#6E6E73]"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size & Measurement Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {matchingColorVariants.map((variant) => {
                const isSelected = currentVariant?.id === variant.id;
                const outOfStock = variant.stock === 0;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`py-2.5 text-xs font-mono border transition-colors ${
                      isSelected
                        ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B] font-semibold'
                        : outOfStock
                        ? 'bg-[#EAE9E4] text-[#A0A0A6] border-[#DFDFD9] line-through cursor-not-allowed'
                        : 'bg-[#F9F9F8] text-[#0A0A0B] border-[#D4D4CE] hover:border-[#0A0A0B]'
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-mono text-[#6E6E73]">
              Availability:{' '}
              <span
                className={
                  (currentVariant?.stock || 0) === 0
                    ? 'text-[#DC2626] font-semibold'
                    : (currentVariant?.stock || 0) <= 5
                    ? 'text-[#D97706] font-semibold'
                    : 'text-[#16A34A] font-semibold'
                }
              >
                {(currentVariant?.stock || 0) === 0
                  ? 'Out of Stock'
                  : (currentVariant?.stock || 0) <= 5
                  ? `Low Stock — Only ${currentVariant?.stock} pieces left in ${currentVariant?.size}`
                  : `In Stock (${currentVariant?.stock} available for immediate dispatch)`}
              </span>
            </p>
          </div>

          {/* Quantity & Primary Purchase Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#D4D4CE] bg-[#F9F9F8]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-[#0A0A0B] hover:bg-[#EAE9E4]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 font-mono tabular-nums text-xs font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(currentVariant?.stock || 10, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="p-3 text-[#0A0A0B] hover:bg-[#EAE9E4]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={!currentVariant || currentVariant.stock === 0}
                onClick={() => onAddToCart(product, currentVariant, quantity, false)}
                className="flex-1 py-3.5 px-6 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#D4FF00] hover:text-[#0A0A0B] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Add to Shopping Bag — ${(product.price * quantity).toLocaleString()}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!currentVariant || currentVariant.stock === 0}
                onClick={() => onAddToCart(product, currentVariant, quantity, true)}
                className="py-3 px-4 text-xs font-semibold bg-[#D4FF00] text-[#0A0A0B] hover:bg-[#e1ff3d] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Buy Now (Express Checkout)
              </button>
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="py-3 px-4 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
              </button>
            </div>
          </div>

          {/* Material Composition & Care Specifications */}
          <div className="pt-5 border-t border-[#E4E4E0] space-y-3 text-xs">
            <div>
              <p className="font-semibold text-[#0A0A0B]">Architectural Construction & Fit</p>
              <p className="text-[#6E6E73] mt-1 leading-relaxed">{product.description}</p>
              <p className="text-[#0A0A0B] mt-2 font-medium">{product.fitNotes}</p>
            </div>

            <div className="pt-3 border-t border-[#E4E4E0]">
              <p className="font-semibold text-[#0A0A0B]">
                Material Composition: <span className="font-normal">{product.fabric}</span>
              </p>
              <ul className="mt-1.5 space-y-1 text-[#6E6E73]">
                {product.careInstructions.map((care, i) => (
                  <li key={i}>· {care}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews & Photo Gallery Section */}
      <section className="border-t border-[#E4E4E0] pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#6E6E73]">Verified Client Feedback</p>
            <h2 className="font-display text-2xl font-bold text-[#0A0A0B] mt-1">
              Reviews & Client Wearing Notes ({productReviews.length})
            </h2>
            <p className="text-xs font-mono tabular-nums text-[#6E6E73] mt-1">
              Average Rating: ★ {product.ratingAvg.toFixed(1)} / 5.0 · 100% Verified Atelier Purchases
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReviewForm((prev) => !prev)}
            className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#D4FF00] hover:text-[#0A0A0B] transition-colors self-start"
          >
            {showReviewForm ? 'Close Review Form' : 'Write a Client Review'}
          </button>
        </div>

        {reviewSuccess && (
          <div className="p-4 bg-[#F1F0EC] border border-[#0A0A0B] text-xs text-[#0A0A0B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Thank you. Your verified review has been published to the garment archive.</span>
          </div>
        )}

        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4 max-w-2xl"
          >
            <h3 className="text-sm font-semibold text-[#0A0A0B]">Submit Verified Garment Review</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rev-author" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Your Name & Title
                </label>
                <input
                  id="rev-author"
                  type="text"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="e.g., Henrik Lindqvist, Architect"
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="rev-rating" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                  Star Rating
                </label>
                <select
                  id="rev-rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE] font-mono"
                >
                  <option value={5}>5 Stars — Exceptional</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Satisfactory</option>
                  <option value={2}>2 Stars — Subpar</option>
                  <option value={1}>1 Star — Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="rev-title" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                Review Headline
              </label>
              <input
                id="rev-title"
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize fit, drape, and fabric quality"
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>

            <div>
              <label htmlFor="rev-comment" className="block text-xs font-medium text-[#0A0A0B] mb-1">
                Detailed Impressions
              </label>
              <textarea
                id="rev-comment"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share notes on sizing, weight, and craftsmanship..."
                className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#0A0A0B] cursor-pointer">
              <input
                type="checkbox"
                checked={includeProductPhoto}
                onChange={(e) => setIncludeProductPhoto(e.target.checked)}
              />
              <Camera className="w-3.5 h-3.5 text-[#6E6E73]" />
              <span>Attach garment studio lookbook photo to review</span>
            </label>

            {reviewError && <p className="text-xs text-[#DC2626]">{reviewError}</p>}

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#242428]"
            >
              Publish Review
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productReviews.length === 0 ? (
            <p className="text-sm text-[#6E6E73]">
              No client reviews recorded for this piece yet. Be the first to share wearing notes.
            </p>
          ) : (
            productReviews.map((rev) => (
              <article
                key={rev.id}
                className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                    <div className="flex items-center gap-1 text-[#0A0A0B] font-mono">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-[#0A0A0B]" />
                      ))}
                    </div>
                    <span>
                      {rev.verifiedPurchase ? 'Verified Atelier Purchase' : 'Client Review'} ·{' '}
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0A0A0B]">{rev.title}</h3>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">{rev.comment}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E4E4E0]">
                  <span className="text-xs font-medium text-[#0A0A0B]">{rev.authorName}</span>
                  {rev.photos && rev.photos.length > 0 && (
                    <div className="w-12 h-12 border border-[#D4D4CE] overflow-hidden">
                      <ResilientImage
                        src={rev.photos[0]}
                        alt={`Review photo by ${rev.authorName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Related Products ("You May Also Like") */}
      <section className="border-t border-[#E4E4E0] pt-12 space-y-6">
        <div>
          <p className="text-xs text-[#6E6E73]">Complementary Tailoring</p>
          <h2 className="font-display text-2xl font-bold text-[#0A0A0B] mt-1">
            You May Also Like
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map((rel) => (
            <ProductCard
              key={rel.id}
              product={rel}
              isWishlisted={wishlistIds.includes(rel.id)}
              onSelectProduct={onSelectProduct}
              onQuickAdd={(p) => onAddToCart(p, p.variants[0], 1, false)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* High-Resolution Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Garment studio zoom"
        >
          <div className="relative max-w-4xl w-full bg-[#0A0A0B] border border-[#2E2E32] p-4">
            <div className="flex items-center justify-between pb-3 text-xs text-[#F9F9F8]">
              <span>{product.name} — High-Resolution Studio Plate</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                aria-label="Close zoom modal"
                className="p-1.5 text-[#F9F9F8] hover:text-[#D4FF00]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden">
              <ResilientImage
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover scale-110"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Size Chart Modal */}
      {isSizeChartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Garment size guide"
        >
          <div className="max-w-2xl w-full bg-[#F9F9F8] border border-[#0A0A0B] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[#0A0A0B]">
                  AURA ATELIER Size & Measurement Matrix
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  All measurements in centimeters (cm) and inches (in)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                aria-label="Close size guide"
                className="p-1.5 text-[#0A0A0B] hover:bg-[#EAE9E4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-[#0A0A0B] text-[#0A0A0B]">
                    <th className="py-2.5 pr-4">Size</th>
                    <th className="py-2.5 px-4">IT / EU</th>
                    <th className="py-2.5 px-4">Chest (cm / in)</th>
                    <th className="py-2.5 px-4">Shoulder (cm)</th>
                    <th className="py-2.5 pl-4">Waist (cm / in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0] text-[#6E6E73]">
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">XS</td>
                    <td className="py-2.5 px-4">44</td>
                    <td className="py-2.5 px-4">88–92 / 34.5–36&quot;</td>
                    <td className="py-2.5 px-4">43.5 cm</td>
                    <td className="py-2.5 pl-4">72–76 / 28–30&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">S</td>
                    <td className="py-2.5 px-4">46</td>
                    <td className="py-2.5 px-4">93–97 / 36.5–38&quot;</td>
                    <td className="py-2.5 px-4">45.0 cm</td>
                    <td className="py-2.5 pl-4">77–81 / 30.5–32&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">M</td>
                    <td className="py-2.5 px-4">48</td>
                    <td className="py-2.5 px-4">98–102 / 38.5–40&quot;</td>
                    <td className="py-2.5 px-4">46.5 cm</td>
                    <td className="py-2.5 pl-4">82–86 / 32.5–34&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">L</td>
                    <td className="py-2.5 px-4">50</td>
                    <td className="py-2.5 px-4">103–108 / 40.5–42.5&quot;</td>
                    <td className="py-2.5 px-4">48.0 cm</td>
                    <td className="py-2.5 pl-4">87–92 / 34.5–36&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-[#0A0A0B]">XL</td>
                    <td className="py-2.5 px-4">52</td>
                    <td className="py-2.5 px-4">109–114 / 43–45&quot;</td>
                    <td className="py-2.5 px-4">49.5 cm</td>
                    <td className="py-2.5 pl-4">93–98 / 36.5–38.5&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
