import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";

// Firebase configuration (Placeholder - User should replace with real config)
const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "dinodex-85400.firebaseapp.com",
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "dinodex-85400",
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "dinodex-85400.firebasestorage.app",
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "84784856309",
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:84784856309:web:a5ad832d5539c06f5f99bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export interface UserData {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    collectedSpecimens: string[]; // Array of dinosaur names
    joinedAt: string;
    lastActive: string;
}

/**
 * Saves or updates a user's profile in Firestore upon login.
 */
export const syncUserProfile = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const now = new Date().toISOString();

    if (!userSnap.exists()) {
        const newUser: UserData = {
            uid: user.uid,
            displayName: user.displayName || "Anonymous Explorer",
            email: user.email || "",
            photoURL: user.photoURL || "",
            collectedSpecimens: [], // Start with empty collection
            joinedAt: now,
            lastActive: now,
        };
        await setDoc(userRef, newUser);
        return newUser;
    } else {
        const existing = userSnap.data() as UserData;
        await updateDoc(userRef, {
            lastActive: now,
            displayName: user.displayName || existing.displayName,
            photoURL: user.photoURL || existing.photoURL,
        });
        return { ...existing, lastActive: now };
    }
};

/**
 * Adds a specimen to the user's permanent collection.
 */
export const collectSpecimen = async (uid: string, dinoName: string) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        collectedSpecimens: arrayUnion(dinoName)
    });
};

/**
 * Removes a specimen from the collection (Admin/Clean-up tool).
 */
export const releaseSpecimen = async (uid: string, dinoName: string) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        collectedSpecimens: arrayRemove(dinoName)
    });
};

/**
 * Real-time listener for user data changes.
 */
export const subscribeToUserData = (uid: string, callback: (data: UserData) => void) => {
    return onSnapshot(doc(db, "users", uid), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as UserData);
        }
    });
};

/**
 * Direct Firebase Popup Sign-In (Recommended for custom buttons)
 */
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return await syncUserProfile(result.user);
};

/**
 * Google Sign-In with Firebase using Credential from GSI (Legacy/One-Tap)
 */
export const signInWithGoogleToken = async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return await syncUserProfile(result.user);
};

/**
 * Logout
 */
export const logoutUser = async () => {
    await signOut(auth);
};
