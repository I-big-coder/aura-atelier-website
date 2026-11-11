import React from 'react';
import { Heart, Plus, Star, ArrowUpRight } from 'lucide-react';
import { Product } from '../types/commerce';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  isWishlisted: boolean;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  layout = 'grid',
  isWishlisted,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const stockLabel =
    totalStock === 0
      ? 'Sold Out'
      : totalStock <= 8
      ? `Low Stock (${totalStock} left)`
      : 'In Stock';

  if (layout === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row gap-6 p-5 bg-[#F1F0EC] border border-[#E4E4E0] transition-transform duration-150 hover:-translate-y-0.5">
        <div
          onClick={() => onSelectProduct(product)}
          className="w-full sm:w-64 aspect-[4/3] bg-[#E8E7E2] overflow-hidden cursor-pointer shrink-0 relative"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 text-xs text-[#6E6E73]">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.fabric}</span>
                <span aria-hidden="true">·</span>
                <span className={totalStock === 0 ? 'text-[#DC2626]' : 'text-[#0A0A0B]'}>
                  {stockLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono tabular-nums text-[#0A0A0B]">
                <Star className="w-3.5 h-3.5 fill-[#0A0A0B]" />
                <span>{product.ratingAvg.toFixed(1)}</span>
                <span className="text-[#6E6E73]">({product.reviewCount})</span>
              </div>
            </div>

            <h3 className="mt-2 text-lg font-semibold text-[#0A0A0B] tracking-tight">
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-[#0A0A0B]"
              >
                {product.name}
              </button>
            </h3>
            <p className="mt-1 text-sm text-[#6E6E73] line-clamp-2 max-w-[68ch]">
              {product.description}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E4E4E0] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-base font-semibold text-[#0A0A0B]">
                ${product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-[#6E6E73] line-through">
                  ${product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={
                  isWishlisted
                    ? `Remove ${product.name} from wishlist`
                    : `Save ${product.name} to wishlist`
                }
                className="p-2.5 border border-[#D4D4CE] bg-[#F9F9F8] text-[#0A0A0B] hover:border-[#0A0A0B] transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted ? 'fill-[#0A0A0B] text-[#0A0A0B]' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="px-4 py-2 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] transition-colors whitespace-nowrap shrink-0"
              >
                Inspect Garment
              </button>
              <button
                type="button"
                disabled={totalStock === 0}
                onClick={() => onQuickAdd(product)}
                className="px-4 py-2 text-xs font-medium bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#242428] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-[#F1F0EC] border border-[#E4E4E0] transition-transform duration-150 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] w-full bg-[#E8E7E2] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          aria-label={`View details for ${product.name}`}
          className="block w-full h-full text-left focus-visible:outline-2 focus-visible:outline-[#0A0A0B]"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-[#F9F9F8]/90 text-[#0A0A0B] border border-[#E4E4E0] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? 'fill-current' : ''
            }`}
          />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed clean metadata with typographic middle-dot separators */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
            <div className="flex items-center gap-1.5 truncate">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{product.fabric.split(',')[0]}</span>
            </div>
            <span className="font-mono tabular-nums text-[#0A0A0B] shrink-0">
              ★ {product.ratingAvg.toFixed(1)}
            </span>
          </div>

          <h3 className="mt-2 text-base font-semibold text-[#0A0A0B] tracking-tight leading-snug">
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-[#0A0A0B] flex items-center justify-between w-full gap-2"
            >
              <span className="truncate">{product.name}</span>
              <ArrowUpRight className="w-4 h-4 text-[#6E6E73] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          </h3>

          <p className="mt-1 text-xs text-[#6E6E73] line-clamp-1">
            {product.origin} · {stockLabel}
          </p>
        </div>

        <div className="mt-4 pt-3.5 border-t border-[#E4E4E0] flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-[15px] font-semibold text-[#0A0A0B]">
              ${product.price.toLocaleString()}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-[#6E6E73] line-through">
                ${product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={totalStock === 0}
              onClick={() => onQuickAdd(product)}
              aria-label={`Quick add ${product.name} to bag`}
              className="px-3.5 py-2 text-xs font-medium bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#D4FF00] hover:text-[#0A0A0B] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
            >
              {totalStock === 0 ? 'Sold Out' : 'Add to Bag'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
