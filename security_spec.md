# AURA ATELIER — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Source of Truth

1. **Global Default-Deny**: All paths not explicitly matched in `firestore.rules` are denied by `match /{document=**} { allow read, write: if false; }`.
2. **Verified Identity & Admin Authority**:
   - All authenticated write operations require `request.auth != null && request.auth.token.email_verified == true`.
   - Admin privileges require either a document in `/admins/$(request.auth.uid)` or the bootstrapped runtime admin email (`bhavikthanki2000@gmail.com`) with `email_verified == true`.
3. **Catalog Integrity (`/products/{productId}`)**:
   - Publicly readable for storefront browsing (`get`, `list`), but creation, updates, and deletions are restricted strictly to `isAdmin()`.
   - Every string field enforces strict `.size()` and regex bounds matching `firebase-blueprint.json`.
4. **Order Isolation & Terminal State Locking (`/orders/{orderId}`)**:
   - Orders can only be read (`get`, `list`) by their `ownerId` (`resource.data.ownerId == request.auth.uid`) or `isAdmin()`.
   - Once an order reaches a terminal state (`status == 'Delivered'` or `status == 'Refunded'`), non-admin updates are permanently locked.
   - `ownerId`, `orderNumber`, and `createdAt` are immutable after creation.
5. **PII Split-Collection Isolation (`/users/{userId}/private/{docId}`)**:
   - Customer PII (`email`, `fullName`, `defaultAddress`) is isolated inside `/users/{userId}/private/{docId}` and strictly restricted to `request.auth.uid == userId || isAdmin()`.
6. **Review Integrity (`/reviews/{reviewId}`)**:
   - Reviews must reference an existing product (`exists(/databases/$(database)/documents/products/$(incoming().productId))`), enforce `authorId == request.auth.uid`, constrain `rating >= 1 && rating <= 5`, and lock `authorId`, `productId`, and `createdAt` on update.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Product**: `{ slug: "coat-01", name: "Coat", category: "Outerwear", fabric: "Wool", price: 950, stockTotal: 10, createdAt: request.time, isFeaturedHack: true }` -> `PERMISSION_DENIED` (blocked by `hasOnly`).
2. **Unverified Admin Email Spoof**: Token with `email: "bhavikthanki2000@gmail.com"`, `email_verified: false` attempting `create` on `/products/coat-01` -> `PERMISSION_DENIED`.
3. **ID Poisoning Attack**: Document ID with 200 characters or invalid characters (`product$123!`) -> `PERMISSION_DENIED` (blocked by `isValidId`).
4. **Order Identity Spoofing**: Authenticated user `uid_A` creating `/orders/ord_1` with `ownerId: "uid_B"` -> `PERMISSION_DENIED`.
5. **Order Terminal State Bypass**: Customer attempting to update an order whose existing `status` is `'Refunded'` or `'Delivered'` -> `PERMISSION_DENIED`.
6. **Value Poisoning on Order Update**: Updating `status` on `/orders/ord_1` to a 1MB string or invalid enum `'Hacked'` -> `PERMISSION_DENIED` (blocked by `isValidOrder(incoming())` wrapper).
7. **Orphaned Review Creation**: Creating `/reviews/rev_1` with `productId: "non_existent_product"` -> `PERMISSION_DENIED` (blocked by `exists()` check on parent product).
8. **Cross-User PII Read**: Authenticated user `uid_A` attempting `get` on `/users/uid_B/private/info` -> `PERMISSION_DENIED`.
9. **Unbounded Query Scraping on Orders**: Authenticated user running `list` on `/orders` without filtering `resource.data.ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
10. **Timestamp Manipulation**: Creating `/reviews/rev_1` with a past/future `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
11. **Immortal Field Mutation**: Updating `createdAt` or `ownerId` on an existing `/orders/{orderId}` document -> `PERMISSION_DENIED`.
12. **Wishlist Hijacking**: Authenticated user `uid_A` attempting to delete `/wishlists/wish_B` owned by `uid_B` -> `PERMISSION_DENIED`.
