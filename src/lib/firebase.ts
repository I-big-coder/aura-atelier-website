import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutFirebase() {
  return signOut(auth);
}

// Defensive Firestore sync helpers strictly matching firebase-blueprint.json & firestore.rules
export async function syncOrderToFirestore(order: {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'card' | 'express_pay' | 'paypal' | 'cod';
}) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const safeId = order.id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `orders/${safeId}`;
  try {
    await setDoc(doc(db, 'orders', safeId), {
      orderNumber: order.orderNumber.replace(/[^A-Z0-9\-]/g, '').slice(0, 64),
      ownerId: auth.currentUser.uid,
      totalAmount: Math.min(500000, Math.max(0, Number(order.totalAmount))),
      paymentMethod: order.paymentMethod,
      status: 'Processing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function syncPrivateProfileToFirestore(profile: {
  email: string;
  fullName: string;
  defaultAddress?: string;
}) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const uid = auth.currentUser.uid;
  const path = `users/${uid}/private/info`;
  try {
    await setDoc(doc(db, 'users', uid, 'private', 'info'), {
      ownerId: uid,
      email: profile.email.slice(0, 160),
      fullName: profile.fullName.slice(0, 100),
      defaultAddress: (profile.defaultAddress || '').slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function removeWishlistFromFirestore(wishlistDocId: string) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const safeId = wishlistDocId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `wishlists/${safeId}`;
  try {
    await deleteDoc(doc(db, 'wishlists', safeId));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
