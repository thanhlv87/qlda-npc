import { useState, useEffect } from 'react';
import { db } from '../services/firebase.ts';
import { permissions } from '../services/permissions.ts';
import type { User } from '../types.ts';

export const useUsers = (currentUser: User | null) => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!currentUser || !currentUser.role) {
            setUsers([]);
            return;
        }

        // For non-Admins, set the users array to just them
        if (!permissions.canFetchAllUsers(currentUser)) {
            setUsers([currentUser]);
            return;
        }

        // Fetch all users only for Admins
        const usersQuery = db.collection('users');
        const usersUnsubscribe = usersQuery.onSnapshot((snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            // Sort client-side to handle users that might be missing a 'name' field
            fetchedUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setUsers(fetchedUsers);
        }, (error) => {
            console.error("Error fetching users:", error);
            setUsers([]);
        });

        return () => usersUnsubscribe();
    }, [currentUser]);

    return { users };
};
