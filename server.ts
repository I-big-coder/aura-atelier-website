import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import {
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
} from './src/data/seedCatalog.ts';
import {
  Product,
  ProductReview,
  Coupon,
  OrderRecord,
  CustomerProfile,
} from './src/types/commerce.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

// Server-authoritative store initialized from seed catalog
let storeProducts: Product[] = structuredClone(INITIAL_PRODUCTS);
let storeReviews: ProductReview[] = structuredClone(INITIAL_REVIEWS);
let storeCoupons: Coupon[] = structuredClone(INITIAL_COUPONS);
let storeOrders: OrderRecord[] = structuredClone(INITIAL_ORDERS);
let storeCustomers: CustomerProfile[] = structuredClone(INITIAL_CUSTOMERS);
const newsletterSubscribers: { email: string; subscribedAt: string }[] = [
  { email: 'elena.rostova@aura-atelier.com', subscribedAt: '2026-10-10T09:00:00Z' },
];
const contactInquiries: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}[] = [];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Optional token verification middleware (attaches decoded Firebase user if Bearer token present)
  app.use(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        (req as express.Request & { firebaseUser?: unknown }).firebaseUser = decoded;
      } catch {
        // Non-blocking for guest checkout & public storefront routes
      }
    }
    next();
  });

  // Dynamic SEO Sitemap XML
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/?view=shop`,
      `${baseUrl}/?view=about`,
      `${baseUrl}/?view=contact`,
      `${baseUrl}/?view=faq`,
      ...storeProducts.map((p) => `${baseUrl}/?product=${p.slug}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Bootstrap store state
  app.get('/api/store', (_req, res) => {
    res.json({
      products: storeProducts,
      reviews: storeReviews,
      coupons: storeCoupons,
      orders: storeOrders,
      customers: storeCustomers,
    });
  });

  // Create or update Product (Admin CRUD)
  app.post('/api/products', (req, res) => {
    const body = req.body as Partial<Product>;
    if (!body.name || !body.category || typeof body.price !== 'number') {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }
    const slug =
      (body.slug || body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `garment-${Date.now()}`;

    const existingIdx = storeProducts.findIndex((p) => p.id === body.id);
    if (existingIdx >= 0) {
      storeProducts[existingIdx] = {
        ...storeProducts[existingIdx],
        ...body,
        slug,
      };
      return res.json(storeProducts[existingIdx]);
    }

    const newProduct: Product = {
      id: body.id || `prod-${Date.now()}`,
      slug,
      name: body.name,
      subtitle: body.subtitle || 'Architectural capsule garment crafted in Italy',
      description:
        body.description ||
        'Constructed with precision tailoring and natural certified fibers in our European partner mills.',
      category: body.category,
      fabric: body.fabric || '100% Virgin Wool',
      origin: body.origin || 'Tailored in Milan, Italy',
      careInstructions: body.careInstructions || ['Specialist dry clean only'],
      fitNotes: body.fitNotes || 'True to size with architectural drape.',
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
      featured: Boolean(body.featured),
      isNewArrival: body.isNewArrival ?? true,
      isBestSeller: Boolean(body.isBestSeller),
      images:
        body.images && body.images.length > 0
          ? body.images
          : [storeProducts[0].images[0]],
      variants:
        body.variants && body.variants.length > 0
          ? body.variants
          : [
              {
                id: `var-${Date.now()}-s`,
                sku: `AA-${slug.slice(0, 4).toUpperCase()}-S`,
                size: 'S',
                colorName: 'Obsidian Black',
                colorHex: '#0A0A0B',
                stock: 10,
              },
              {
                id: `var-${Date.now()}-m`,
                sku: `AA-${slug.slice(0, 4).toUpperCase()}-M`,
                size: 'M',
                colorName: 'Obsidian Black',
                colorHex: '#0A0A0B',
                stock: 12,
              },
              {
                id: `var-${Date.now()}-l`,
                sku: `AA-${slug.slice(0, 4).toUpperCase()}-L`,
                size: 'L',
                colorName: 'Obsidian Black',
                colorHex: '#0A0A0B',
                stock: 8,
              },
            ],
      ratingAvg: 5.0,
      reviewCount: 1,
      createdAt: new Date().toISOString(),
    };

    storeProducts = [newProduct, ...storeProducts];
    return res.status(201).json(newProduct);
  });

  // Bulk upload products (Admin Bulk Import)
  app.post('/api/products/bulk', (req, res) => {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty array of products.' });
    }
    const created: Product[] = items.map((item, idx) => {
      const name = String(item.name || `Atelier Capsule Garment ${idx + 1}`);
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return {
        id: `prod-bulk-${Date.now()}-${idx}`,
        slug: `${slug}-${idx + 1}`,
        name,
        subtitle: String(item.subtitle || 'Limited edition architectural garment'),
        description: String(
          item.description ||
            'Crafted from traceable natural fibers with minimalist architectural lines.'
        ),
        category: item.category || 'Outerwear',
        fabric: String(item.fabric || '100% Virgin Wool'),
        origin: 'Tailored in Italy',
        careInstructions: ['Specialist dry clean only'],
        fitNotes: 'Relaxed architectural cut.',
        price: Number(item.price) || 540,
        featured: Boolean(item.featured),
        isNewArrival: true,
        isBestSeller: false,
        images: [storeProducts[idx % storeProducts.length].images[0]],
        variants: [
          {
            id: `var-bulk-${Date.now()}-${idx}-s`,
            sku: `AA-BLK-${idx}-S`,
            size: 'S',
            colorName: item.colorName || 'Obsidian Black',
            colorHex: '#0A0A0B',
            stock: Number(item.stock) || 10,
          },
          {
            id: `var-bulk-${Date.now()}-${idx}-m`,
            sku: `AA-BLK-${idx}-M`,
            size: 'M',
            colorName: item.colorName || 'Obsidian Black',
            colorHex: '#0A0A0B',
            stock: Number(item.stock) || 12,
          },
        ],
        ratingAvg: 4.9,
        reviewCount: 1,
        createdAt: new Date().toISOString(),
      };
    });

    storeProducts = [...created, ...storeProducts];
    return res.status(201).json({ addedCount: created.length, products: created });
  });

  // Delete Product
  app.delete('/api/products/:id', (req, res) => {
    storeProducts = storeProducts.filter((p) => p.id !== req.params.id);
    return res.json({ deletedId: req.params.id });
  });

  // Post a Customer Review
  app.post('/api/reviews', (req, res) => {
    const { productId, authorId, authorName, rating, title, comment, photos } =
      req.body;
    if (!productId || !title || !comment) {
      return res.status(400).json({ error: 'Product, headline, and review comment are required.' });
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      productId,
      authorId: authorId || 'guest-reviewer',
      authorName: authorName || 'Verified Atelier Client',
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: String(title).slice(0, 120),
      comment: String(comment).slice(0, 1000),
      photos: Array.isArray(photos) ? photos : [],
      verifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    storeReviews = [newReview, ...storeReviews];

    // Recalculate product ratingAvg and reviewCount
    const prodReviews = storeReviews.filter((r) => r.productId === productId);
    const avg =
      prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    storeProducts = storeProducts.map((p) =>
      p.id === productId
        ? {
            ...p,
            ratingAvg: Number(avg.toFixed(1)),
            reviewCount: prodReviews.length,
          }
        : p
    );

    return res.status(201).json(newReview);
  });

  // Create Order & Decrement Variant Stock
  app.post('/api/orders', (req, res) => {
    const orderData = req.body as Partial<OrderRecord>;
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one garment.' });
    }

    const orderNumber =
      orderData.orderNumber ||
      `ORD-AURA-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const createdOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      orderNumber,
      ownerId: orderData.ownerId || 'guest-shopper',
      customerName:
        orderData.customerName ||
        orderData.shippingAddress?.recipientName ||
        'Atelier Client',
      customerEmail:
        orderData.customerEmail ||
        orderData.shippingAddress?.email ||
        'client@aura-atelier.com',
      shippingAddress: orderData.shippingAddress!,
      shippingMethod: orderData.shippingMethod || 'standard',
      paymentMethod: orderData.paymentMethod || 'card',
      items: orderData.items,
      subtotal: Number(orderData.subtotal || 0),
      discountAmount: Number(orderData.discountAmount || 0),
      shippingCost: Number(orderData.shippingCost || 0),
      taxAmount: Number(orderData.taxAmount || 0),
      totalAmount: Number(orderData.totalAmount || 0),
      promoCode: orderData.promoCode,
      status: 'Processing',
      trackingNumber: `DHL-AA-${Math.floor(100000000 + Math.random() * 900000000)}`,
      estimatedDelivery: 'Estimated arrival in 3–5 business days',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Decrement variant stock
    for (const item of createdOrder.items) {
      storeProducts = storeProducts.map((prod) => {
        if (prod.id !== item.productId) return prod;
        return {
          ...prod,
          variants: prod.variants.map((v) =>
            v.id === item.variantId
              ? { ...v, stock: Math.max(0, v.stock - item.quantity) }
              : v
          ),
        };
      });
    }

    // Increment coupon usage
    if (createdOrder.promoCode) {
      storeCoupons = storeCoupons.map((c) =>
        c.code.toUpperCase() === createdOrder.promoCode?.toUpperCase()
          ? { ...c, usageCount: c.usageCount + 1 }
          : c
      );
    }

    storeOrders = [createdOrder, ...storeOrders];
    return res.status(201).json(createdOrder);
  });

  // Update Order Status or Process Refund
  app.patch('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    let updated: OrderRecord | null = null;
    storeOrders = storeOrders.map((o) => {
      if (o.id === req.params.id) {
        updated = { ...o, status, updatedAt: new Date().toISOString() };
        return updated;
      }
      return o;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(updated);
  });

  // Manage Coupons (Create / Toggle / Delete)
  app.post('/api/coupons', (req, res) => {
    const { code, description, discountType, discountValue, minOrderAmount } =
      req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }
    const cleanCode = String(code).trim().toUpperCase();
    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      description: description || `${cleanCode} promotional privilege`,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue) || 15,
      minOrderAmount: Number(minOrderAmount) || 0,
      active: true,
      usageCount: 0,
    };
    storeCoupons = [
      newCoupon,
      ...storeCoupons.filter((c) => c.code !== cleanCode),
    ];
    return res.status(201).json(newCoupon);
  });

  app.patch('/api/coupons/:id/toggle', (req, res) => {
    storeCoupons = storeCoupons.map((c) =>
      c.id === req.params.id ? { ...c, active: !c.active } : c
    );
    return res.json({ coupons: storeCoupons });
  });

  // Newsletter subscription
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    newsletterSubscribers.push({
      email: String(email).trim(),
      subscribedAt: new Date().toISOString(),
    });
    return res.status(201).json({
      message: 'Welcome to the AURA ATELIER Private Journal. Enjoy 10% off with code WELCOME10.',
    });
  });

  // Contact Inquiry
  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    const record = {
      id: `inq-${Date.now()}`,
      name: String(name),
      email: String(email),
      subject: String(subject || 'Client Concierge Inquiry'),
      message: String(message),
      createdAt: new Date().toISOString(),
    };
    contactInquiries.push(record);
    return res.status(201).json(record);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AURA ATELIER server listening on http://localhost:${PORT}`);
  });
}

startServer();
