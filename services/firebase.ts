// FIX: Switched to Firebase v8 compatibility imports to resolve module resolution errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/messaging';

// SECURE: Replaced hardcoded Firebase configuration with environment variables.
// This is a critical security fix to prevent exposing keys in public repositories.
// The user must now provide these variables in their deployment environment.
// FIX: Using import.meta.env for Vite compatibility with VITE_ prefix
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

// Initialize Firebase Cloud Messaging
// Check if messaging is supported (not in all browsers/environments)
let messaging = null;
try {
  if (app && firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (error) {
  console.log('Firebase messaging not supported in this environment');
}

// FIX: Export the firebase object itself for use with features like FieldValue.
export { auth, db, storage, googleProvider, firebase, messaging };