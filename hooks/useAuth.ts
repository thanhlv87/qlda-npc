import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase.ts';
import type { User } from '../types.ts';
import type { firebase } from '../services/firebase.ts';

type FirebaseUser = firebase.User;

export const useAuth = () => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Effect for handling auth state changes and creating user profiles
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (!userDoc.exists) {
                    // This is a new user. Create their profile document in Firestore.
                    try {
                        await userDocRef.set({
                            email: user.email,
                            name: user.displayName || 'Người dùng mới',
                            role: null, // Pending approval
                        });
                        console.log(`Created user document for ${user.email}`);
                    } catch (error) {
                        console.error("Error creating user document:", error);
                    }
                }
                setFirebaseUser(user);
            } else {
                setFirebaseUser(null);
                setCurrentUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for fetching the current user's profile from Firestore
    useEffect(() => {
        if (!firebaseUser) {
            setIsAuthLoading(false);
            return;
        }

        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const unsubscribe = userDocRef.onSnapshot((userDoc) => {
            if (userDoc.exists) {
                const data = userDoc.data();
                const userData = { id: userDoc.id, ...data } as User;
                setCurrentUser(userData);
            } else {
                setCurrentUser(null);
            }
            setIsAuthLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to load user profile.");
            auth.signOut();
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseUser]);

    return {
        firebaseUser,
        currentUser,
        authError,
        isAuthLoading,
        setAuthError,
        setCurrentUser,
        setFirebaseUser,
    };
};
