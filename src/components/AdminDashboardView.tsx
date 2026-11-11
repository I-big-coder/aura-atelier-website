import React, { useState } from 'react';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Plus,
  Upload,
  Trash2,
  Printer,
  RotateCcw,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Product,
  ProductCategory,
  OrderRecord,
  OrderStatus,
  CustomerProfile,
  Coupon,
} from '../types/commerce';
import { computeStoreAnalytics } from '../utils/commerceRules';

interface AdminDashboardViewProps {
  products: Product[];
  orders: OrderRecord[];
  customers: CustomerProfile[];
  coupons: Coupon[];
  onCreateOrUpdateProduct: (product: Partial<Product>) => Promise<void>;
  onBulkImportProducts: (items: Array<Partial<Product> & { stock?: number; colorName?: string }>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onCreateCoupon: (coupon: Partial<Coupon>) => Promise<void>;
  onToggleCoupon: (couponId: string) => Promise<void>;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  orders,
  customers,
  coupons,
  onCreateOrUpdateProduct,
  onBulkImportProducts,
  onDeleteProduct,
  onUpdateOrderStatus,
  onCreateCoupon,
  onToggleCoupon,
}) => {
  const [section, setSection] = useState<
    'analytics' | 'products' | 'orders' | 'customers' | 'coupons'
  >('analytics');

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Outerwear');
  const [prodFabric, setProdFabric] = useState('100% Virgin Wool');
  const [prodPrice, setProdPrice] = useState('890');
  const [prodStock, setProdStock] = useState('12');
  const [prodDescription, setProdDescription] = useState('');

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState(
    JSON.stringify(
      [
        {
          name: 'Vespera Double-Breasted Cashmere Coat',
          category: 'Outerwear',
          fabric: '100% Cashmere',
          price: 1390,
          stock: 8,
          colorName: 'Obsidian Black',
        },
        {
          name: 'Nocturne Fine-Ribbed Silk Polo',
          category: 'Knitwear',
          fabric: '70% Mulberry Silk, 30% Merino',
          price: 420,
          stock: 15,
          colorName: 'Chalk White',
        },
      ],
      null,
      2
    )
  );
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Coupon Form State
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDesc, setCpnDesc] = useState('');
  const [cpnType, setCpnType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [cpnVal, setCpnVal] = useState('15');
  const [cpnMin, setCpnMin] = useState('300');

  // Invoice viewer modal
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const metrics = computeStoreAnalytics(products, orders, customers);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Outerwear');
    setProdFabric('100% Virgin Wool');
    setProdPrice('890');
    setProdStock('12');
    setProdDescription('Tailored in Milan from traceable natural fibers.');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdFabric(prod.fabric);
    setProdPrice(String(prod.price));
    setProdStock(String(prod.variants[0]?.stock || 10));
    setProdDescription(prod.description);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const stockNum = Math.max(0, Number(prodStock) || 0);
    await onCreateOrUpdateProduct({
      id: editingProduct?.id,
      name: prodName.trim(),
      category: prodCategory,
      fabric: prodFabric.trim(),
      price: Math.max(1, Number(prodPrice) || 500),
      description: prodDescription.trim(),
      variants: editingProduct
        ? editingProduct.variants.map((v, i) =>
            i === 0 ? { ...v, stock: stockNum } : v
          )
        : [
            {
              id: `var-${Date.now()}-s`,
              sku: `AA-ADM-S`,
              size: 'S',
              colorName: 'Obsidian Black',
              colorHex: '#0A0A0B',
              stock: stockNum,
            },
            {
              id: `var-${Date.now()}-m`,
              sku: `AA-ADM-M`,
              size: 'M',
              colorName: 'Obsidian Black',
              colorHex: '#0A0A0B',
              stock: stockNum,
            },
          ],
    });
    setIsProductModalOpen(false);
    setAdminToast(`Saved garment "${prodName.trim()}" to catalog.`);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setBulkError('JSON must be a non-empty array of product objects.');
        return;
      }
      await onBulkImportProducts(parsed);
      setIsBulkModalOpen(false);
      setAdminToast(`Bulk imported ${parsed.length} garments into catalog.`);
    } catch {
      setBulkError('Invalid JSON format. Please check syntax.');
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;
    await onCreateCoupon({
      code: cpnCode.trim().toUpperCase(),
      description: cpnDesc.trim() || `${cpnCode.toUpperCase()} privilege`,
      discountType: cpnType,
      discountValue: Number(cpnVal) || 10,
      minOrderAmount: Number(cpnMin) || 0,
    });
    setCpnCode('');
    setCpnDesc('');
    setAdminToast(`Created promo code ${cpnCode.trim().toUpperCase()}.`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 256px Admin Sidebar */}
        <aside className="lg:col-span-3 xl:col-span-2 bg-[#0A0A0B] text-[#F9F9F8] border border-[#242428] p-5 space-y-6">
          <div className="border-b border-[#242428] pb-4">
            <p className="text-[11px] font-mono text-[#D4FF00]">MERCHANT OPERATIONS</p>
            <h1 className="font-display text-lg font-bold mt-1">Atelier Admin</h1>
          </div>

          <nav aria-label="Admin sections" className="flex flex-col gap-1">
            {[
              { id: 'analytics' as const, label: 'Sales Analytics', icon: BarChart3 },
              { id: 'products' as const, label: `Products (${products.length})`, icon: ShoppingBag },
              { id: 'orders' as const, label: `Orders (${orders.length})`, icon: Package },
              { id: 'customers' as const, label: `Customers (${customers.length})`, icon: Users },
              { id: 'coupons' as const, label: `Coupons (${coupons.length})`, icon: Tag },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`px-3.5 py-2.5 text-xs font-medium flex items-center gap-2.5 text-left transition-colors ${
                    section === item.id
                      ? 'bg-[#D4FF00] text-[#0A0A0B] font-semibold'
                      : 'text-[#B4B4BB] hover:text-[#F9F9F8] hover:bg-[#141416]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Admin Viewport */}
        <div className="lg:col-span-9 xl:col-span-10 space-y-6">
          {adminToast && (
            <div className="p-3.5 bg-[#0A0A0B] text-[#D4FF00] border border-[#242428] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminToast}</span>
              </div>
              <button type="button" onClick={() => setAdminToast(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. Sales & Traffic Analytics */}
          {section === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E4E4E0] pb-4">
                <div>
                  <p className="text-xs text-[#6E6E73]">Admin Console / Executive Telemetry</p>
                  <h2 className="font-display text-2xl font-bold text-[#0A0A0B] mt-0.5">
                    Revenue, Inventory & Conversion Overview
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-3.5 py-2 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk JSON Import</span>
                  </button>
                  <button
                    type="button"
                    onClick={openNewProductModal}
                    className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Garment</span>
                  </button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-5">
                  <p className="text-xs text-[#6E6E73]">Net Settled Revenue</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#0A0A0B] mt-1">
                    ${metrics.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-mono text-[#16A34A] mt-1">
                    +18.4% vs prior 30 days
                  </p>
                </div>
                <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-5">
                  <p className="text-xs text-[#6E6E73]">Average Order Value</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#0A0A0B] mt-1">
                    ${metrics.averageOrderValue.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-mono text-[#6E6E73] mt-1">
                    Across {metrics.totalOrderCount} total orders
                  </p>
                </div>
                <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-5">
                  <p className="text-xs text-[#6E6E73]">Total Stock Units</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#0A0A0B] mt-1">
                    {metrics.totalInventoryUnits} pcs
                  </p>
                  <p className="text-[11px] font-mono text-[#6E6E73] mt-1">
                    Across {products.length} active SKUs
                  </p>
                </div>
                <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-5">
                  <p className="text-xs text-[#6E6E73]">Storefront Traffic (30d)</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#0A0A0B] mt-1">
                    {metrics.monthlyTraffic.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-mono text-[#16A34A] mt-1">
                    {metrics.conversionRate}% Checkout Conversion
                  </p>
                </div>
              </div>

              {/* Top Performing Garments Table */}
              <div className="bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#0A0A0B]">
                  Top Performing Garments by Revenue
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-[#0A0A0B] text-[#0A0A0B]">
                        <th className="py-2.5 pr-4 font-sans">Garment Name</th>
                        <th className="py-2.5 px-4 text-right">Units Dispatched</th>
                        <th className="py-2.5 pl-4 text-right">Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E4E0]">
                      {metrics.topProducts.map((tp) => (
                        <tr key={tp.productId} className="hover:bg-[#EAE9E4]">
                          <td className="py-2.5 pr-4 font-sans font-medium text-[#0A0A0B]">
                            {tp.name}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#6E6E73]">
                            {tp.unitsSold}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-semibold text-[#0A0A0B]">
                            ${tp.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Product Management (CRUD + Bulk Upload + Variants) */}
          {section === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E4E0] pb-4">
                <div>
                  <p className="text-xs text-[#6E6E73]">Catalog Inventory & Variants</p>
                  <h2 className="font-display text-2xl font-bold text-[#0A0A0B]">
                    Product Management ({products.length} Garments)
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-4 py-2 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk JSON Import</span>
                  </button>
                  <button
                    type="button"
                    onClick={openNewProductModal}
                    className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Garment</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#F1F0EC] border border-[#E4E4E0] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#0A0A0B] text-[#0A0A0B] bg-[#EAE9E4]">
                      <th className="py-3 px-4">Garment</th>
                      <th className="py-3 px-4">Category · Material</th>
                      <th className="py-3 px-4 text-right font-mono">Price</th>
                      <th className="py-3 px-4 text-right font-mono">Variants / Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E0]">
                    {products.map((p) => {
                      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                      return (
                        <tr key={p.id} className="hover:bg-[#EAE9E4]">
                          <td className="py-3 px-4 font-semibold text-[#0A0A0B]">{p.name}</td>
                          <td className="py-3 px-4 text-[#6E6E73]">
                            {p.category} · {p.fabric}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                            ${p.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {p.variants.length} variants · {totalStock} units
                          </td>
                          <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="underline text-[#0A0A0B] font-medium"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(p.id)}
                              aria-label={`Delete ${p.name}`}
                              className="text-[#DC2626] hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Order Management (Status Updates, Refunds, Invoices) */}
          {section === 'orders' && (
            <div className="space-y-6">
              <div className="border-b border-[#E4E4E0] pb-4">
                <p className="text-xs text-[#6E6E73]">Fulfillment, Refunds & Tax Invoices</p>
                <h2 className="font-display text-2xl font-bold text-[#0A0A0B]">
                  Order Management ({orders.length})
                </h2>
              </div>

              <div className="bg-[#F1F0EC] border border-[#E4E4E0] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#0A0A0B] bg-[#EAE9E4] text-[#0A0A0B]">
                      <th className="py-3 px-4 font-mono">Order #</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4 text-right font-mono">Total</th>
                      <th className="py-3 px-4">Status Workflow</th>
                      <th className="py-3 px-4 text-right">Refund & Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E0]">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#EAE9E4]">
                        <td className="py-3 px-4 font-mono font-semibold text-[#0A0A0B]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#0A0A0B]">{ord.customerName}</p>
                          <p className="text-[#6E6E73]">{ord.customerEmail}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                          ${ord.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Status for order ${ord.orderNumber}`}
                            value={ord.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                            }
                            className="bg-[#F9F9F8] border border-[#D4D4CE] px-2.5 py-1.5 text-xs font-mono"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {ord.status !== 'Refunded' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(ord.id, 'Refunded')}
                              className="px-2.5 py-1 text-xs border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Issue Refund</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(ord)}
                            className="px-2.5 py-1 text-xs border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8] inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Customer Management */}
          {section === 'customers' && (
            <div className="space-y-6">
              <div className="border-b border-[#E4E4E0] pb-4">
                <p className="text-xs text-[#6E6E73]">Registered Client Directory</p>
                <h2 className="font-display text-2xl font-bold text-[#0A0A0B]">
                  Customer Accounts ({customers.length})
                </h2>
              </div>

              <div className="bg-[#F1F0EC] border border-[#E4E4E0] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#0A0A0B] bg-[#EAE9E4]">
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Email & Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right font-mono">Orders</th>
                      <th className="py-3 px-4 text-right font-mono">Lifetime Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E0]">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#EAE9E4]">
                        <td className="py-3 px-4 font-semibold text-[#0A0A0B]">{c.name}</td>
                        <td className="py-3 px-4 text-[#6E6E73]">
                          {c.email} · {c.phone}
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[#0A0A0B]">
                          {c.role}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {c.totalOrders}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                          ${c.totalSpent.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Discount & Coupon Engine */}
          {section === 'coupons' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="font-display text-xl font-bold text-[#0A0A0B]">
                  Active & Archived Promotional Codes
                </h2>
                <div className="space-y-3">
                  {coupons.map((cpn) => (
                    <div
                      key={cpn.id}
                      className="bg-[#F1F0EC] border border-[#E4E4E0] p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-[#0A0A0B]">
                          {cpn.code}{' '}
                          <span className="text-xs font-normal text-[#6E6E73]">
                            · {cpn.active ? 'Active' : 'Paused'} · Used {cpn.usageCount} times
                          </span>
                        </p>
                        <p className="text-xs text-[#6E6E73] mt-0.5">{cpn.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCoupon(cpn.id)}
                        className="px-3 py-1.5 text-xs font-medium border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-[#F9F9F8]"
                      >
                        {cpn.active ? 'Pause Code' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleCreateCouponSubmit}
                className="lg:col-span-5 bg-[#F1F0EC] border border-[#E4E4E0] p-6 space-y-4 self-start"
              >
                <h3 className="text-sm font-semibold text-[#0A0A0B]">
                  Create Promotional Privilege Code
                </h3>
                <div>
                  <label htmlFor="cpn-code" className="block text-xs font-medium mb-1">
                    Promo Code (Uppercase)
                  </label>
                  <input
                    id="cpn-code"
                    type="text"
                    value={cpnCode}
                    onChange={(e) => setCpnCode(e.target.value)}
                    placeholder="e.g. MILAN25"
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#F9F9F8] border border-[#D4D4CE]"
                  />
                </div>
                <div>
                  <label htmlFor="cpn-desc" className="block text-xs font-medium mb-1">
                    Description
                  </label>
                  <input
                    id="cpn-desc"
                    type="text"
                    value={cpnDesc}
                    onChange={(e) => setCpnDesc(e.target.value)}
                    placeholder="25% off seasonal outerwear"
                    className="w-full px-3 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="cpn-type" className="block text-xs font-medium mb-1">
                      Type
                    </label>
                    <select
                      id="cpn-type"
                      value={cpnType}
                      onChange={(e) =>
                        setCpnType(
                          e.target.value as 'percentage' | 'fixed' | 'free_shipping'
                        )
                      }
                      className="w-full px-2 py-2 text-xs bg-[#F9F9F8] border border-[#D4D4CE]"
                    >
                      <option value="percentage">% Off</option>
                      <option value="fixed">$ Fixed</option>
                      <option value="free_shipping">Free Ship</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cpn-val" className="block text-xs font-medium mb-1">
                      Value
                    </label>
                    <input
                      id="cpn-val"
                      type="number"
                      value={cpnVal}
                      onChange={(e) => setCpnVal(e.target.value)}
                      className="w-full px-2 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                    />
                  </div>
                  <div>
                    <label htmlFor="cpn-min" className="block text-xs font-medium mb-1">
                      Min Order ($)
                    </label>
                    <input
                      id="cpn-min"
                      type="number"
                      value={cpnMin}
                      onChange={(e) => setCpnMin(e.target.value)}
                      className="w-full px-2 py-2 text-xs font-mono bg-[#F9F9F8] border border-[#D4D4CE]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
                >
                  Publish Promo Code
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Garment Editor"
        >
          <form
            onSubmit={handleSaveProduct}
            className="max-w-lg w-full bg-[#F9F9F8] border border-[#0A0A0B] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
              <h3 className="font-display text-lg font-bold text-[#0A0A0B]">
                {editingProduct ? `Edit ${editingProduct.name}` : 'Create New Atelier Garment'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                aria-label="Close garment editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label htmlFor="adm-prod-name" className="block text-xs font-medium mb-1">
                Garment Title *
              </label>
              <input
                id="adm-prod-name"
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#F1F0EC] border border-[#D4D4CE]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adm-prod-cat" className="block text-xs font-medium mb-1">
                  Category
                </label>
                <select
                  id="adm-prod-cat"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 text-xs bg-[#F1F0EC] border border-[#D4D4CE]"
                >
                  <option value="Outerwear">Outerwear</option>
                  <option value="Knitwear">Knitwear</option>
                  <option value="Tailoring">Tailoring</option>
                  <option value="Silk & Shirts">Silk & Shirts</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label htmlFor="adm-prod-fab" className="block text-xs font-medium mb-1">
                  Material Composition
                </label>
                <input
                  id="adm-prod-fab"
                  type="text"
                  value={prodFabric}
                  onChange={(e) => setProdFabric(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F1F0EC] border border-[#D4D4CE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adm-prod-price" className="block text-xs font-medium mb-1">
                  Retail Price ($ USD)
                </label>
                <input
                  id="adm-prod-price"
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F1F0EC] border border-[#D4D4CE]"
                />
              </div>
              <div>
                <label htmlFor="adm-prod-stock" className="block text-xs font-medium mb-1">
                  Primary Variant Stock
                </label>
                <input
                  id="adm-prod-stock"
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F1F0EC] border border-[#D4D4CE]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adm-prod-desc" className="block text-xs font-medium mb-1">
                Garment Description
              </label>
              <textarea
                id="adm-prod-desc"
                rows={3}
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F1F0EC] border border-[#D4D4CE]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-xs border border-[#D4D4CE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Save Garment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk JSON Upload Modal */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Product Import"
        >
          <form
            onSubmit={handleBulkSubmit}
            className="max-w-xl w-full bg-[#F9F9F8] border border-[#0A0A0B] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
              <h3 className="font-display text-lg font-bold text-[#0A0A0B]">
                Bulk Catalog Import (JSON Batch)
              </h3>
              <button type="button" onClick={() => setIsBulkModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              rows={10}
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-[#F1F0EC] border border-[#D4D4CE]"
            />
            {bulkError && <p className="text-xs text-[#DC2626]">{bulkError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs border border-[#D4D4CE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Import Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Order Tax Invoice"
        >
          <div className="max-w-xl w-full bg-[#F9F9F8] border border-[#0A0A0B] p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-[#0A0A0B] pb-4">
              <div>
                <p className="font-display text-xl font-bold">AURA ATELIER S.r.l.</p>
                <p className="text-xs text-[#6E6E73]">Via Solferino 18, 20121 Milano, Italy</p>
              </div>
              <div className="text-right font-mono text-xs">
                <p className="font-bold">TAX INVOICE</p>
                <p>{invoiceOrder.orderNumber}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p>
                <strong>Client:</strong> {invoiceOrder.customerName} ({invoiceOrder.customerEmail})
              </p>
              <p>
                <strong>Destination:</strong> {invoiceOrder.shippingAddress.street},{' '}
                {invoiceOrder.shippingAddress.city} {invoiceOrder.shippingAddress.postalCode}
              </p>
              <p>
                <strong>Status:</strong> {invoiceOrder.status}
              </p>
            </div>

            <div className="border-t border-b border-[#E4E4E0] py-3 space-y-2 text-xs font-mono tabular-nums">
              {invoiceOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.productName} ({item.size})
                  </span>
                  <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E4E4E0] flex justify-between font-bold">
                <span>Total Settled</span>
                <span>${invoiceOrder.totalAmount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-[#F9F9F8]"
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="px-4 py-2 text-xs border border-[#0A0A0B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
