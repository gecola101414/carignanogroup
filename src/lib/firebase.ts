import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Shift, StaffMember, UserCredential } from "../types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'appState', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Real-time Firestore sync helpers for Shifts and Staff
const SHIFTS_DOC = doc(db, "appState", "shifts");
const STAFF_DOC = doc(db, "appState", "staff");
const CREDENTIALS_DOC = doc(db, "appState", "credentials");

export const firestoreSync = {
  // Listen to real-time updates for credentials
  subscribeCredentials(onUpdate: (creds: UserCredential[], updatedAt?: string) => void, initialFallback?: UserCredential[]) {
    return onSnapshot(
      CREDENTIALS_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.items)) {
            onUpdate(data.items as UserCredential[], data.updatedAt as string | undefined);
          }
        } else if (initialFallback && initialFallback.length > 0) {
          setDoc(CREDENTIALS_DOC, {
            items: initialFallback,
            updatedAt: new Date().toISOString()
          }).catch(err => console.error("Error seeding initial credentials:", err));
        }
      },
      (error) => {
        console.error("Error listening to credentials in Firestore:", error);
        handleFirestoreError(error, OperationType.GET, "appState/credentials");
      }
    );
  },

  async saveCredentials(creds: UserCredential[], updatedAt?: string) {
    try {
      await setDoc(CREDENTIALS_DOC, {
        items: creds,
        updatedAt: updatedAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving credentials to Firestore:", error);
      handleFirestoreError(error, OperationType.WRITE, "appState/credentials");
    }
  },

  // Listen to real-time updates for shifts
  subscribeShifts(onUpdate: (shifts: Shift[], updatedAt?: string) => void, initialFallback?: Shift[]) {
    return onSnapshot(
      SHIFTS_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.items)) {
            onUpdate(data.items as Shift[], data.updatedAt as string | undefined);
          }
        } else if (initialFallback && initialFallback.length > 0) {
          // Seed Firestore if document doesn't exist yet
          setDoc(SHIFTS_DOC, {
            items: initialFallback,
            updatedAt: new Date().toISOString()
          }).catch(err => console.error("Error seeding initial shifts:", err));
        }
      },
      (error) => {
        console.error("Error listening to shifts in Firestore:", error);
        handleFirestoreError(error, OperationType.GET, "appState/shifts");
      }
    );
  },

  // Save shifts to Firestore
  async saveShifts(shifts: Shift[], updatedAt?: string) {
    try {
      await setDoc(SHIFTS_DOC, {
        items: shifts,
        updatedAt: updatedAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving shifts to Firestore:", error);
      handleFirestoreError(error, OperationType.WRITE, "appState/shifts");
    }
  },

  // Listen to real-time updates for staff
  subscribeStaff(onUpdate: (staff: StaffMember[], updatedAt?: string) => void, initialFallback?: StaffMember[]) {
    return onSnapshot(
      STAFF_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.items)) {
            onUpdate(data.items as StaffMember[], data.updatedAt as string | undefined);
          }
        } else if (initialFallback && initialFallback.length > 0) {
          setDoc(STAFF_DOC, {
            items: initialFallback,
            updatedAt: new Date().toISOString()
          }).catch(err => console.error("Error seeding initial staff:", err));
        }
      },
      (error) => {
        console.error("Error listening to staff in Firestore:", error);
        handleFirestoreError(error, OperationType.GET, "appState/staff");
      }
    );
  },

  // Save staff to Firestore
  async saveStaff(staff: StaffMember[], updatedAt?: string) {
    try {
      await setDoc(STAFF_DOC, {
        items: staff,
        updatedAt: updatedAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving staff to Firestore:", error);
      handleFirestoreError(error, OperationType.WRITE, "appState/staff");
    }
  }
};
