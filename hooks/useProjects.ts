import { useState, useEffect } from 'react';
import { db } from '../services/firebase.ts';
import { permissions } from '../services/permissions.ts';
import type { Project, User } from '../types.ts';

export const useProjects = (currentUser: User | null) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !currentUser.role) {
            setProjects([]);
            setIsProjectsLoading(false);
            return;
        }

        setIsProjectsLoading(true);
        const unsubs: (() => void)[] = [];

        // Fetch projects based on permissions
        if (permissions.canAddProject(currentUser)) {
            // Admins and Department Heads get all projects
            const projectsQuery = db.collection('projects').orderBy('name');
            const projectsUnsubscribe = projectsQuery.onSnapshot((snapshot) => {
                const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                setProjects(fetchedProjects);
                setIsProjectsLoading(false);
            }, (error) => {
                console.error("Error fetching projects:", error);
                setIsProjectsLoading(false);
            });
            unsubs.push(projectsUnsubscribe);
        } else {
            // PMs and Supervisors get assigned projects
            const pmQuery = db.collection('projects').where('projectManagerIds', 'array-contains', currentUser.id);
            const lsQuery = db.collection('projects').where('leadSupervisorIds', 'array-contains', currentUser.id);

            let pmProjects: Project[] = [];
            let lsProjects: Project[] = [];

            const mergeAndSetProjects = () => {
                const projectMap = new Map<string, Project>();
                pmProjects.forEach(p => projectMap.set(p.id, p));
                lsProjects.forEach(p => projectMap.set(p.id, p));
                const sortedProjects = Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                setProjects(sortedProjects);
                setIsProjectsLoading(false);
            };

            const unsubPM = pmQuery.onSnapshot((snapshot) => {
                pmProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching manager projects:", error);
                setIsProjectsLoading(false);
            });

            const unsubLS = lsQuery.onSnapshot((snapshot) => {
                lsProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching supervisor projects:", error);
                setIsProjectsLoading(false);
            });

            unsubs.push(unsubPM);
            unsubs.push(unsubLS);
        }

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [currentUser]);

    return { projects, isProjectsLoading };
};
