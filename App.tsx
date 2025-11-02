import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
// FIX: Switched to Firebase v8 compat imports and syntax to resolve module errors.
// All modular v9 imports have been removed.
import { auth, db, googleProvider, firebase, storage } from './services/firebase.ts';
import type { User, Project, DailyReport, ProjectReview, Role, ProjectFile, ProjectFolder } from './types.ts';
import { permissions } from './services/permissions.ts';

// Components
import Login from './components/Login.tsx';
import Header from './components/Header.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';
import Toast from './components/Toast.tsx';
import Footer from './components/Footer.tsx';
import ApproveUserModal from './components/ApproveUserModal.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';

// Lazy load components for code splitting
const ProjectDetails = lazy(() => import('./components/ProjectDetails.tsx'));
const AddProjectForm = lazy(() => import('./components/AddProjectForm.tsx'));
const UserManagement = lazy(() => import('./components/UserManagement.tsx'));
const Dashboard = lazy(() => import('./components/Dashboard.tsx'));


export type AppView = 'dashboard' | 'projectDetails' | 'addProject' | 'userManagement';
type ToastMessage = { id: number; message: string; type: 'success' | 'error' };
// FIX: Defined FirebaseUser type using the v8 compat syntax.
type FirebaseUser = firebase.User;

const App: React.FC = () => {
    // Authentication state
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);


    // Data state
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);

    // UI/Navigation state
    const [view, setView] = useState<AppView>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    const [isFilesLoading, setIsFilesLoading] = useState(true);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
    const [userToApprove, setUserToApprove] = useState<User | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, { progress: number; name: string }>>({});
    
    // FIX: Add a guard clause to handle missing Firebase configuration gracefully.
    // This prevents the application from crashing and displays a clear error message
    // if the necessary environment variables are not set.
    if (!auth || !db || !storage || !googleProvider) {
        return (
            <div className="min-h-screen bg-neutral flex flex-col items-center justify-center p-4">
                <div className="text-center bg-base-100 p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg mx-auto border border-red-300">
                    <h2 className="text-2xl sm:text-3xl font-bold text-error mb-4">Lỗi Cấu hình Ứng dụng</h2>
                    <p className="text-gray-600 mb-2">
                        Không thể kết nối đến dịch vụ backend (Firebase).
                    </p>
                    <p className="text-sm text-gray-500">
                        (For developers: Please ensure that all `FIREBASE_*` environment variables are correctly set in your deployment environment.)
                    </p>
                </div>
            </div>
        );
    }

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    };

    // Effect for handling auth state changes and creating user profiles.
    // This is the most reliable place to handle user profile creation.
    useEffect(() => {
        // FIX: Switched to v8 syntax for onAuthStateChanged.
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // FIX: Switched to v8 syntax for document reference.
                const userDocRef = db.collection('users').doc(user.uid);
                // FIX: Switched to v8 syntax for getting a document.
                const userDoc = await userDocRef.get();

                if (!userDoc.exists) {
                    // This is a new user. Create their profile document in Firestore.
                    try {
                        // FIX: Switched to v8 syntax for setting a document.
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
                // User is signed out
                setFirebaseUser(null);
                setCurrentUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for fetching the current user's profile from Firestore
    // This runs after onAuthStateChanged sets the firebaseUser
    useEffect(() => {
        if (!firebaseUser) {
            setIsAuthLoading(false);
            return;
        };

        // FIX: Switched to v8 syntax for document reference.
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        // FIX: Switched to v8 syntax for onSnapshot.
        const unsubscribe = userDocRef.onSnapshot((userDoc) => {
            if (userDoc.exists) {
                const data = userDoc.data();
                const userData = { id: userDoc.id, ...data } as User;
                setCurrentUser(userData);
            } else {
                // This state can happen briefly for a new user while their doc is being created.
                // The listener will fire again once the document is created by onAuthStateChanged.
                setCurrentUser(null);
            }
            setIsAuthLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to load user profile.");
            // FIX: Switched to v8 syntax for signOut.
            auth.signOut();
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseUser]);

    // Effect for fetching projects and users for ADMINS (who can see everything)
    useEffect(() => {
        if (!currentUser || !currentUser.role) { // Don't fetch data for pending users
            setProjects([]);
            // Still need to fetch users if admin, to see pending users
             if (currentUser && permissions.canFetchAllUsers(currentUser)) {
                 // continue
             } else {
                setUsers([]);
                setIsProjectsLoading(false);
                return () => {};
             }
        }

        setIsProjectsLoading(true);
        const unsubs: (() => void)[] = [];

        // For non-Admins, set the users array to just them. Others will be loaded if needed.
        if (!permissions.canFetchAllUsers(currentUser)) {
           if(currentUser) setUsers([currentUser]);
        }
        // Fetch all users only for Admins
        else {
            // FIX: Switched to v8 syntax for collection query.
            const usersQuery = db.collection('users');
            // FIX: Switched to v8 syntax for onSnapshot.
            const usersUnsubscribe = usersQuery.onSnapshot((snapshot) => {
                const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                // Sort client-side to handle users that might be missing a 'name' field
                fetchedUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setUsers(fetchedUsers);
            }, (error) => {
                console.error("Error fetching users:", error);
                setUsers([]);
            });
            unsubs.push(usersUnsubscribe);
        }

        // Fetch projects based on permissions
        if (permissions.canAddProject(currentUser)) { // Admins and Department Heads get all projects
            // FIX: Switched to v8 syntax for collection query with ordering.
            const projectsQuery = db.collection('projects').orderBy('name');
            // FIX: Switched to v8 syntax for onSnapshot.
            const projectsUnsubscribe = projectsQuery.onSnapshot((snapshot) => {
                const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                setProjects(fetchedProjects);
                setIsProjectsLoading(false);
            }, (error) => {
                console.error("Error fetching projects:", error);
                setIsProjectsLoading(false);
            });
            unsubs.push(projectsUnsubscribe);
        } else if (currentUser) { // PMs and Supervisors get assigned projects
            // FIX: Switched to v8 syntax for collection query with where clause.
            const pmQuery = db.collection('projects').where('projectManagerIds', 'array-contains', currentUser.id);
            // FIX: Switched to v8 syntax for collection query with where clause.
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

            // FIX: Switched to v8 syntax for onSnapshot.
            const unsubPM = pmQuery.onSnapshot((snapshot) => {
                pmProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching manager projects:", error);
                setIsProjectsLoading(false);
            });

            // FIX: Switched to v8 syntax for onSnapshot.
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

    // Effect for fetching files and folders for the selected project
    useEffect(() => {
        if (!selectedProjectId) {
            setProjectFiles([]);
            setProjectFolders([]);
            setIsFilesLoading(false);
            return;
        }

        setIsFilesLoading(true);

        const filesUnsub = db.collection('projects').doc(selectedProjectId).collection('files')
            .onSnapshot(snapshot => {
                const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
                setProjectFiles(files);
                setIsFilesLoading(false);
            }, error => {
                console.error("Error fetching project files:", error);
                addToast('Lỗi khi tải danh sách tệp.', 'error');
                setIsFilesLoading(false);
            });

        const foldersUnsub = db.collection('projects').doc(selectedProjectId).collection('folders')
            .onSnapshot(snapshot => {
                const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFolder));
                setProjectFolders(folders);
            }, error => {
                console.error("Error fetching project folders:", error);
                 addToast('Lỗi khi tải danh sách thư mục.', 'error');
            });

        return () => {
            filesUnsub();
            foldersUnsub();
        };
    }, [selectedProjectId]);

    // Memoized derived state
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);

    // Auth handlers
    const handleLogin = async (email: string, password: string) => {
        setAuthError(null);
        try {
            // FIX: Switched to v8 syntax for signInWithEmailAndPassword.
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error: any) {
            console.error(error);
            setAuthError("Email hoặc mật khẩu không đúng.");
        }
    };
    
    const handleGoogleLogin = async () => {
        setAuthError(null);
        try {
            // The onAuthStateChanged listener will handle profile creation.
            // This function just needs to initiate the sign-in process.
            // FIX: Switched to v8 syntax for signInWithPopup.
            await auth.signInWithPopup(googleProvider);
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                return;
            }
            setAuthError("Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại.");
        }
    };

    const handleLogout = async () => {
        // FIX: Switched to v8 syntax for signOut.
        await auth.signOut();
        setCurrentUser(null);
        setFirebaseUser(null);
        setView('dashboard');
        setSelectedProjectId(null);
    };

    // Project handlers
    const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
        try {
            // FIX: Switched to v8 syntax for adding a document.
            await db.collection('projects').add(projectData);
            setView('dashboard');
            addToast('Dự án đã được tạo thành công!', 'success');
        } catch (error) {
            console.error("Error adding project:", error);
            addToast('Lỗi khi tạo dự án.', 'error');
        }
    };

    const handleUpdateProject = async (projectData: Project) => {
         try {
            // FIX: Switched to v8 syntax for document reference.
            const projectRef = db.collection('projects').doc(projectData.id);
            const { id, ...dataToUpdate } = projectData;
            // FIX: Switched to v8 syntax for updating a document.
            await projectRef.update(dataToUpdate);
            addToast('Dự án đã được cập nhật!', 'success');
        } catch (error) {
            console.error("Error updating project:", error);
            addToast('Lỗi khi cập nhật dự án.', 'error');
        }
    };

    const handleDeleteProject = (projectId: string, projectName: string) => {
        setProjectToDelete({ id: projectId, name: projectName });
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const projectId = projectToDelete.id;
            // Batch delete reports 
            // FIX: Switched to v8 syntax for collection query with where clause.
            const reportsQuery = db.collection('reports').where('projectId', '==', projectId);
            // FIX: Switched to v8 syntax for getting documents.
            const reportsSnapshot = await reportsQuery.get();

            const deletePromises: Promise<void>[] = [];
            // FIX: Switched to v8 syntax for document deletion.
            reportsSnapshot.docs.forEach(d => deletePromises.push(d.ref.delete()));
            
            await Promise.all(deletePromises);
            
            // FIX: Switched to v8 syntax for document deletion.
            await db.collection('projects').doc(projectId).delete();

            addToast(`Dự án "${projectToDelete.name}" đã được xóa.`, 'success');
            setProjectToDelete(null);
            if (selectedProjectId === projectId) {
                setView('dashboard');
                setSelectedProjectId(null);
            }
        } catch (error) {
            console.error("Error performing cascading delete for project:", error);
            addToast('Lỗi khi xóa dự án.', 'error');
            setProjectToDelete(null);
        }
    };
    
    // Report handlers
    const handleAddReport = async (reportData: Omit<DailyReport, 'id'>) => {
        try {
            // FIX: Switched to v8 syntax for adding a document.
            await db.collection('reports').add(reportData);
            addToast('Báo cáo đã được gửi thành công!', 'success');
        } catch (error) {
            console.error("Error adding report:", error);
            addToast('Lỗi khi gửi báo cáo.', 'error');
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        try {
            // FIX: Switched to v8 syntax for document reference.
            const reportRef = db.collection('reports').doc(reportData.id);
            const { id, ...dataToUpdate } = reportData;
            // FIX: Switched to v8 syntax for updating a document.
            await reportRef.update(dataToUpdate);
            addToast('Báo cáo đã được cập nhật!', 'success');
        } catch (error) {
            console.error("Error updating report:", error);
            addToast('Lỗi khi cập nhật báo cáo.', 'error');
        }
    };

    const handleDeleteReport = async (reportId: string, projectId: string) => {
        try {
            // FIX: Switched to v8 syntax for document reference.
            const projectRef = db.collection('projects').doc(projectId);
            // Atomically delete the review field and the report document
            // FIX: Switched to v8 syntax for updating with FieldValue.delete().
            await projectRef.update({
                [`reviews.${reportId}`]: firebase.firestore.FieldValue.delete()
            });
            // FIX: Switched to v8 syntax for document deletion.
            await db.collection('reports').doc(reportId).delete();
            addToast('Báo cáo đã được xóa.', 'success');
        } catch (error) {
            console.error("Error deleting report and its review:", error);
            addToast('Lỗi khi xóa báo cáo.', 'error');
        }
    };
    
    const handleAddReportReview = async (projectId: string, reportId: string, comment: string, user: User) => {
        try {
            const projectRef = db.collection('projects').doc(projectId);
            const reviewData: ProjectReview = {
                id: `${Date.now()}-${user.id}`, // Unique ID for this comment
                comment,
                reviewedById: user.id,
                reviewedByName: user.name, // Denormalize user name
                reviewedAt: new Date().toISOString(),
            };
            // Use arrayUnion to append to the reviews array
            await projectRef.update({
                [`reviews.${reportId}`]: firebase.firestore.FieldValue.arrayUnion(reviewData)
            });
            addToast('Nhận xét đã được lưu.', 'success');
        } catch (error) {
            console.error("Error adding report review:", error);
            addToast('Không thể lưu nhận xét.', 'error');
        }
    };

    const handleDeleteReportReview = async (projectId: string, reportId: string, reviewToDelete: ProjectReview) => {
        try {
            const projectRef = db.collection('projects').doc(projectId);
            // Use arrayRemove to remove the specific review from the array
            await projectRef.update({
                [`reviews.${reportId}`]: firebase.firestore.FieldValue.arrayRemove(reviewToDelete)
            });
            addToast('Nhận xét đã được xóa.', 'success');
        } catch (error) {
            console.error("Error deleting report review:", error);
            addToast('Không thể xóa nhận xét.', 'error');
        }
    };

    // User handlers
    const handleUpdateUser = async (userData: User) => {
        try {
            // FIX: Switched to v8 syntax for document reference.
            const userRef = db.collection('users').doc(userData.id);
            const { id, ...dataToUpdate } = userData;
            // FIX: Switched to v8 syntax for updating a document.
            await userRef.update(dataToUpdate);
            addToast('Thông tin người dùng đã được cập nhật.', 'success');
        } catch (error) {
            console.error("Error updating user:", error);
            addToast('Lỗi khi cập nhật người dùng.', 'error');
        }
    };

    const handleApproveUser = (user: User, role: Role) => {
        handleUpdateUser({ ...user, role });
        setUserToApprove(null);
    };

    const handleDeleteUser = async (userId: string) => {
        if (currentUser && userId === currentUser.id) {
            addToast("Bạn không thể tự xóa chính mình.", 'error');
            return;
        }
        try {
            // FIX: Switched to v8 syntax for document deletion.
            await db.collection('users').doc(userId).delete();
            addToast('Người dùng đã được xóa.', 'success');
        } catch (error) {
            console.error("Error deleting user:", error);
            addToast('Lỗi khi xóa người dùng.', 'error');
        }
    };

    // --- Document Management Handlers ---
    const handleCreateFolder = async (folderName: string, projectId: string, path: string) => {
        if (!currentUser) return;
        try {
            await db.collection('projects').doc(projectId).collection('folders').add({
                name: folderName,
                path: path,
                createdBy: currentUser.id,
                createdAt: new Date().toISOString(),
            });
            addToast(`Thư mục "${folderName}" đã được tạo.`, 'success');
        } catch (error) {
            console.error("Error creating folder:", error);
            addToast('Lỗi khi tạo thư mục.', 'error');
        }
    };

    const handleUploadFiles = (files: File[], projectId: string, path: string) => {
        if (!currentUser) return;
        files.forEach(file => {
            const uniqueId = `${Date.now()}-${file.name}`;
            const storagePath = `projects/${projectId}${path}${file.name}`;
            const uploadTask = storage.ref(storagePath).put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(prev => ({
                        ...prev,
                        [uniqueId]: { progress, name: file.name },
                    }));
                },
                (error) => {
                    console.error(`Upload failed for ${file.name}:`, error);
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[uniqueId];
                        return newProgress;
                    });
                    addToast(`Tải lên tệp ${file.name} thất bại.`, 'error');
                },
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    await db.collection('projects').doc(projectId).collection('files').add({
                        name: file.name,
                        url: downloadURL,
                        path: path,
                        size: file.size,
                        type: file.type,
                        uploadedBy: currentUser.id,
                        uploadedAt: new Date().toISOString(),
                    });

                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[uniqueId];
                        return newProgress;
                    });
                    addToast(`Tải lên tệp ${file.name} thành công.`, 'success');
                }
            );
        });
    };
    
    const handleDeleteFile = async (file: ProjectFile, projectId: string) => {
        try {
            await db.collection('projects').doc(projectId).collection('files').doc(file.id).delete();
            const fileRef = storage.refFromURL(file.url);
            await fileRef.delete();
            addToast(`Tệp "${file.name}" đã được xóa.`, 'success');
        } catch (error) {
            console.error("Error deleting file:", error);
            addToast('Lỗi khi xóa tệp.', 'error');
        }
    };

    const handleDeleteFolder = async (folder: ProjectFolder, projectId: string) => {
        // Warning: This is a non-recursive delete. It only deletes the folder document.
        // For a full solution, a cloud function would be needed to delete contents.
        try {
            const folderPath = `${folder.path}${folder.name}/`;
            const filesInFolder = await db.collection('projects').doc(projectId).collection('files').where('path', '==', folderPath).limit(1).get();
            const subfolders = await db.collection('projects').doc(projectId).collection('folders').where('path', '==', folderPath).limit(1).get();

            if (!filesInFolder.empty || !subfolders.empty) {
                addToast('Không thể xóa thư mục không rỗng.', 'error');
                return;
            }
            await db.collection('projects').doc(projectId).collection('folders').doc(folder.id).delete();
            addToast(`Thư mục "${folder.name}" đã được xóa.`, 'success');
        } catch (error) {
            console.error("Error deleting folder:", error);
            addToast('Lỗi khi xóa thư mục.', 'error');
        }
    };

    const handleBulkDelete = async (items: { files: ProjectFile[]; folders: ProjectFolder[] }, projectId: string) => {
        const { files: filesToDelete, folders: foldersToDelete } = items;
        if (filesToDelete.length === 0 && foldersToDelete.length === 0) return;
    
        const batch = db.batch();
        const storagePromises: Promise<void>[] = [];
        const failedFolders: string[] = [];
        let deletedFileCount = 0;
        let deletedFolderCount = 0;
    
        // Concurrently check all folders for content
        const folderChecks = foldersToDelete.map(async (folder) => {
            const folderPath = `${folder.path}${folder.name}/`;
            const filesInFolderQuery = db.collection('projects').doc(projectId).collection('files').where('path', '==', folderPath).limit(1);
            const subfoldersQuery = db.collection('projects').doc(projectId).collection('folders').where('path', '==', folderPath).limit(1);
    
            const [filesSnapshot, subfoldersSnapshot] = await Promise.all([filesInFolderQuery.get(), subfoldersQuery.get()]);
            
            return { folder, isEmpty: filesSnapshot.empty && subfoldersSnapshot.empty };
        });

        const folderResults = await Promise.all(folderChecks);

        folderResults.forEach(({ folder, isEmpty }) => {
            if (isEmpty) {
                const folderRef = db.collection('projects').doc(projectId).collection('folders').doc(folder.id);
                batch.delete(folderRef);
                deletedFolderCount++;
            } else {
                failedFolders.push(folder.name);
            }
        });

        // Prepare file deletions
        for (const file of filesToDelete) {
            const fileDocRef = db.collection('projects').doc(projectId).collection('files').doc(file.id);
            batch.delete(fileDocRef);
    
            try {
                const storageRef = storage.refFromURL(file.url);
                storagePromises.push(storageRef.delete());
                deletedFileCount++;
            } catch (error) {
                console.error(`Invalid storage URL for ${file.name}, skipping storage delete.`, error);
            }
        }
        
        try {
            await Promise.all(storagePromises);
            await batch.commit();
    
            let successMessage = '';
            if (deletedFileCount > 0 || deletedFolderCount > 0) {
                successMessage = `Đã xóa thành công ${deletedFileCount} tệp và ${deletedFolderCount} thư mục.`;
            }
    
            let errorMessage = '';
            if (failedFolders.length > 0) {
                errorMessage = `Không thể xóa ${failedFolders.length} thư mục không rỗng: ${failedFolders.join(', ')}.`;
            }
    
            if (successMessage) addToast(successMessage, 'success');
            if (errorMessage) addToast(errorMessage, 'error');
    
        } catch (error) {
            console.error("Error during bulk delete:", error);
            addToast('Đã xảy ra lỗi trong quá trình xóa hàng loạt.', 'error');
        }
    };


    // Navigation handlers
    const handleSelectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
        setView('projectDetails');
    };

    const handleBackToDashboard = () => {
        setSelectedProjectId(null);
        setView('dashboard');
    };

    // Render logic
    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <p className="text-xl">Đang tải ứng dụng...</p>
            </div>
        );
    }

    if (!firebaseUser) {
        return <Login onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} error={authError} />;
    }

    if (!currentUser) {
         return (
            <div className="min-h-screen bg-neutral flex flex-col">
                <Header user={{id: firebaseUser.uid, email: firebaseUser.email || '', name: firebaseUser.displayName || '', role: null}} onLogout={handleLogout} />
                <main className="flex-grow flex items-center justify-center p-4">
                     <div className="text-center bg-base-100 p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-200">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Đang xử lý...</h2>
                        <p className="text-gray-600">
                            Đang kiểm tra thông tin tài khoản của bạn. Vui lòng đợi trong giây lát.
                        </p>
                     </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    if (!currentUser.role) {
        return (
            <div className="min-h-screen bg-neutral flex flex-col">
                <Header user={currentUser} onLogout={handleLogout} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center bg-base-100 p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-200">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Tài khoản đang chờ phê duyệt</h2>
                        <p className="text-gray-600 mb-6">
                            Tài khoản của bạn (<span className="font-semibold">{currentUser.email}</span>) đã được tạo thành công và đang chờ quản trị viên cấp quyền truy cập.
                        </p>
                        <p className="text-gray-600">
                            Vui lòng liên hệ quản trị viên để hoàn tất quá trình.
                        </p>
                         <button
                            onClick={handleLogout}
                            className="mt-8 bg-accent hover:opacity-90 text-white font-bold py-2 px-8 rounded-md transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const renderContent = () => {
        switch (view) {
            case 'projectDetails':
                if (selectedProject) {
                    return (
                        <ProjectDetails
                            project={selectedProject}
                            currentUser={currentUser}
                            users={users}
                            onBack={handleBackToDashboard}
                            onAddReport={handleAddReport}
                            onUpdateProject={handleUpdateProject}
                            onDeleteProject={handleDeleteProject}
                            onUpdateReport={handleUpdateReport}
                            onDeleteReport={handleDeleteReport}
                            onAddReportReview={handleAddReportReview}
                            onDeleteReportReview={handleDeleteReportReview}
                            // Document Management Props
                            files={projectFiles}
                            folders={projectFolders}
                            isFilesLoading={isFilesLoading}
                            onUploadFiles={handleUploadFiles}
                            onCreateFolder={handleCreateFolder}
                            onDeleteFile={handleDeleteFile}
                            onDeleteFolder={handleDeleteFolder}
                            onBulkDelete={handleBulkDelete}
                            uploadProgress={uploadProgress}
                        />
                    );
                }
                handleBackToDashboard();
                return null;
            case 'addProject':
                 return <AddProjectForm onAddProject={handleAddProject} onCancel={handleBackToDashboard} users={users} />;
            case 'userManagement':
                return <UserManagement users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onBack={handleBackToDashboard} onApproveUser={setUserToApprove} />;
            case 'dashboard':
            default:
                return (
                    <Dashboard
                        currentUser={currentUser}
                        projects={projects}
                        users={users}
                        isProjectsLoading={isProjectsLoading}
                        onSelectProject={handleSelectProject}
                        onDeleteProject={handleDeleteProject}
                        onNavigate={setView}
                        onApproveUser={setUserToApprove}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-neutral flex flex-col">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="p-4 sm:p-6 lg:p-8 flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                    {renderContent()}
                </Suspense>
            </main>
            <Footer />
            {projectToDelete && (
                <ConfirmationModal 
                    message={`Bạn có chắc chắn muốn xóa dự án "${projectToDelete.name}"?\nTất cả báo cáo và nhận xét liên quan cũng sẽ bị xóa vĩnh viễn.`}
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
             {userToApprove && (
                <ApproveUserModal 
                    user={userToApprove}
                    onApprove={handleApproveUser}
                    onCancel={() => setUserToApprove(null)}
                />
            )}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;