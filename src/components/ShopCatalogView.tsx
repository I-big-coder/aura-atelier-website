import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Product,
  CatalogFilterState,
  GarmentSize,
} from '../types/commerce';
import {
  filterAndSortProducts,
  paginateItems,
} from '../utils/commerceRules';
import { ProductCard } from './ProductCard';

interface ShopCatalogViewProps {
  products: Product[];
  filters: CatalogFilterState;
  wishlistIds: string[];
  onUpdateFilters: (next: Partial<CatalogFilterState>) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

const CATEGORIES = ['All', 'Outerwear', 'Knitwear', 'Tailoring', 'Silk & Shirts', 'Accessories'];
const SIZES: ('All' | GarmentSize)[] = ['All', 'XS', 'S', 'M', 'L', 'XL'];
const COLORS = ['All', 'Obsidian Black', 'Chalk White', 'Slate Charcoal', 'Pearl Ivory'];
const FABRICS = ['All', 'Wool', 'Cashmere', 'Merino', 'Silk', 'Cotton', 'Calfskin'];

export const ShopCatalogView: React.FC<ShopCatalogViewProps> = ({
  products,
  filters,
  wishlistIds,
  onUpdateFilters,
  onResetFilters,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const pageSize = 6;

  const filteredProducts = filterAndSortProducts(products, filters);
  const paginated = paginateItems(filteredProducts, currentPage, pageSize);

  const handleFilterChange = (patch: Partial<CatalogFilterState>) => {
    setCurrentPage(1);
    onUpdateFilters(patch);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
      {/* Catalog Header */}
      <div className="border-b border-[#E4E4E0] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs text-[#6E6E73]">
            AURA ATELIER · Permanent & Seasonal Wardrobe Archive
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0B] mt-1">
            {filters.category === 'All' ? 'All Atelier Garments' : filters.category}
          </h1>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden px-3.5 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filter Archive'}</span>
          </button>

          <div className="relative min-w-[220px] sm:min-w-[280px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
              placeholder="Filter by garment, wool, silk..."
              aria-label="Filter catalog by keyword"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F1F0EC] border border-[#D4D4CE] text-[#0A0A0B] placeholder-[#6E6E73] focus:outline-none focus:border-[#0A0A0B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort-select" className="text-xs text-[#6E6E73] whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="catalog-sort-select"
              value={filters.sortBy}
              onChange={(e) =>
                handleFilterChange({
                  sortBy: e.target.value as CatalogFilterState['sortBy'],
                })
              }
              className="bg-[#F1F0EC] border border-[#D4D4CE] px-3 py-2 text-xs font-medium text-[#0A0A0B] focus:outline-none focus:border-[#0A0A0B]"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Popularity & Rating</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div
            className="flex items-center border border-[#D4D4CE] bg-[#F1F0EC]"
            role="group"
            aria-label="Catalog layout mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#0A0A0B] text-[#F9F9F8]'
                  : 'text-[#6E6E73] hover:text-[#0A0A0B]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Catalog Layout: Filters Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Multi-Faceted Filter Sidebar */}
        <aside
          aria-label="Product filters"
          className={`${
            mobileFiltersOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-3 bg-[#F1F0EC] border border-[#E4E4E0] p-5 space-y-6`}
        >
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0A0A0B]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Archive</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                onResetFilters();
              }}
              className="text-xs text-[#6E6E73] hover:text-[#0A0A0B] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#0A0A0B]">Category</p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleFilterChange({ category: cat })}
                  className={`text-left px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between ${
                    filters.category === cat
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] font-medium'
                      : 'text-[#6E6E73] hover:text-[#0A0A0B]'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="space-y-2 pt-4 border-t border-[#E4E4E0]">
            <p className="text-xs font-semibold text-[#0A0A0B]">Available Size</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleFilterChange({ size: sz })}
                  className={`py-1.5 text-xs font-mono border transition-colors ${
                    filters.size === sz
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                      : 'bg-[#F9F9F8] text-[#0A0A0B] border-[#D4D4CE] hover:border-[#0A0A0B]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Filter */}
          <div className="space-y-2 pt-4 border-t border-[#E4E4E0]">
            <p className="text-xs font-semibold text-[#0A0A0B]">Atelier Shade</p>
            <div className="flex flex-col gap-1">
              {COLORS.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => handleFilterChange({ color: clr })}
                  className={`text-left px-2.5 py-1.5 text-xs transition-colors ${
                    filters.color === clr
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] font-medium'
                      : 'text-[#6E6E73] hover:text-[#0A0A0B]'
                  }`}
                >
                  {clr}
                </button>
              ))}
            </div>
          </div>

          {/* Fabric Filter */}
          <div className="space-y-2 pt-4 border-t border-[#E4E4E0]">
            <p className="text-xs font-semibold text-[#0A0A0B]">Material & Fiber</p>
            <div className="flex flex-wrap gap-1.5">
              {FABRICS.map((fab) => (
                <button
                  key={fab}
                  type="button"
                  onClick={() => handleFilterChange({ fabric: fab })}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    filters.fabric === fab
                      ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                      : 'bg-[#F9F9F8] text-[#6E6E73] border-[#D4D4CE] hover:text-[#0A0A0B]'
                  }`}
                >
                  {fab}
                </button>
              ))}
            </div>
          </div>

          {/* Price Ceiling Slider */}
          <div className="space-y-2 pt-4 border-t border-[#E4E4E0]">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="price-range-slider" className="font-semibold text-[#0A0A0B]">
                Max Price
              </label>
              <span className="font-mono tabular-nums text-[#0A0A0B]">
                ${filters.maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              id="price-range-slider"
              type="range"
              min={300}
              max={1500}
              step={50}
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange({ maxPrice: Number(e.target.value) })}
              className="w-full accent-[#0A0A0B] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#6E6E73]">
              <span>$300</span>
              <span>$1,500</span>
            </div>
          </div>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex items-center justify-between text-xs text-[#6E6E73]">
            <span>
              Showing{' '}
              <strong className="font-mono tabular-nums text-[#0A0A0B]">
                {paginated.items.length}
              </strong>{' '}
              of{' '}
              <strong className="font-mono tabular-nums text-[#0A0A0B]">
                {filteredProducts.length}
              </strong>{' '}
              matching garments
            </span>
            {(filters.category !== 'All' ||
              filters.size !== 'All' ||
              filters.color !== 'All' ||
              filters.fabric !== 'All' ||
              filters.searchQuery !== '' ||
              filters.maxPrice < 1500) && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  onResetFilters();
                }}
                className="underline text-[#0A0A0B]"
              >
                Clear active filters
              </button>
            )}
          </div>

          {paginated.items.length === 0 ? (
            <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-12 text-center space-y-4">
              <p className="font-display text-xl font-semibold text-[#0A0A0B]">
                No Garments Match Your Current Filter Criteria
              </p>
              <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
                Try broadening your material, size, or price ceiling selection to view our permanent
                collection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  onResetFilters();
                }}
                className="px-5 py-2.5 text-xs font-medium bg-[#0A0A0B] text-[#F9F9F8] hover:bg-[#242428] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout="grid"
                  isWishlisted={wishlistIds.includes(product.id)}
                  onSelectProduct={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout="list"
                  isWishlisted={wishlistIds.includes(product.id)}
                  onSelectProduct={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          )}

          {/* Pagination Bar */}
          {paginated.totalPages > 1 && (
            <div className="pt-6 border-t border-[#E4E4E0] flex items-center justify-between">
              <p className="text-xs font-mono tabular-nums text-[#6E6E73]">
                Page {paginated.currentPage} of {paginated.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginated.currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 text-xs font-medium border border-[#D4D4CE] bg-[#F1F0EC] text-[#0A0A0B] disabled:opacity-40 hover:border-[#0A0A0B] flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                {Array.from({ length: paginated.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 text-xs font-mono tabular-nums border transition-colors ${
                      paginated.currentPage === pageNum
                        ? 'bg-[#0A0A0B] text-[#F9F9F8] border-[#0A0A0B]'
                        : 'bg-[#F1F0EC] text-[#0A0A0B] border-[#D4D4CE] hover:border-[#0A0A0B]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={paginated.currentPage >= paginated.totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(paginated.totalPages, p + 1))
                  }
                  className="px-3 py-2 text-xs font-medium border border-[#D4D4CE] bg-[#F1F0EC] text-[#0A0A0B] disabled:opacity-40 hover:border-[#0A0A0B] flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
