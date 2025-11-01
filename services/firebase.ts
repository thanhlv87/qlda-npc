// FIX: Switched to Firebase v8 compatibility imports to resolve module resolution errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// SECURE: Replaced hardcoded Firebase configuration with environment variables.
// This is a critical security fix to prevent exposing keys in public repositories.
// The user must now provide these variables in their deployment environment.
// FIX: Added checks for `process` and `process.env` to prevent runtime errors in environments
// where they are not defined. Also removed 'VITE_' prefix for better compatibility.
const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_API_KEY : undefined,
  authDomain: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_AUTH_DOMAIN : undefined,
  projectId: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_PROJECT_ID : undefined,
  storageBucket: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_STORAGE_BUCKET : undefined,
  messagingSenderId: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_MESSAGING_SENDER_ID : undefined,
  appId: (typeof process !== 'undefined' && process.env) ? process.env.FIREBASE_APP_ID : undefined,
};

// Initialize Firebase only if all configuration keys are present.
// This prevents runtime errors if the environment variables are not set.
const areFirebaseVarsPresent = Object.values(firebaseConfig).every(value => value);
let app: firebase.app.App | null = null;

if (areFirebaseVarsPresent) {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app(); // Get the default app if it's already initialized
    }
} else {
    // FIX: The user's error log shows "Firebase configuration is missing". This is my own console error.
    // This confirms the environment variables are not being set. The app must handle this state.
    console.error("Firebase configuration is missing or incomplete. Please set up environment variables (e.g., FIREBASE_API_KEY). The app will not connect to Firebase.");
}

// Conditionally export services to prevent crashes if initialization fails.
// The main App component will handle the 'null' case.
const auth = app ? firebase.auth() : null;
const db = app ? firebase.firestore() : null;
const storage = app ? firebase.storage() : null;
const googleProvider = app ? new firebase.auth.GoogleAuthProvider() : null;

// FIX: Export the firebase object itself for use with features like FieldValue.
export { auth, db, storage, googleProvider, firebase };