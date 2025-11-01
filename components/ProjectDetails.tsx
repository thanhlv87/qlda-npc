import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import type { Project, DailyReport, User, ProjectReview, ProjectFile, ProjectFolder } from '../types.ts';
import { Role } from '../types.ts';
import { db } from '../services/firebase.ts';
import { permissions } from '../services/permissions.ts';
import { generateProjectSummary } from '../services/geminiService.ts';
import AddReportForm from './AddReportForm.tsx';
import EditReportForm from './EditReportForm.tsx';
import EditProjectForm from './EditProjectForm.tsx';
import ReportCard from './ReportCard.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import ImageLightbox from './ImageLightbox.tsx'; // New component for image gallery
import ReportCardSkeleton from './ReportCardSkeleton.tsx'; // New component for loading state
import ReportDetailsModal from './ReportDetailsModal.tsx'; // New component for report details
import { ArrowLeftIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CompanyIcon, ExternalLinkIcon, PhoneIcon, TuneIcon, UserCircleIcon, UserGroupIcon, XIcon } from './Icons.tsx';
import ApprovalTimeline from './ApprovalTimeline.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import CalendarView from './CalendarView.tsx'; // Import the new calendar component
import ProjectStats from './ProjectStats.tsx'; // Import the new stats component

const DocumentManager = lazy(() => import('./DocumentManager.tsx'));


// Modal for Project Manager to add a review
const ReviewReportModal: React.FC<{
    report: DailyReport;
    currentUser: User;
    onClose: () => void;
    onAddReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
}> = ({ report, currentUser, onClose, onAddReview }) => {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        await onAddReview(report.projectId, report.id, comment, currentUser);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b">
                    <h3 className="text-xl font-bold text-primary">Xác nhận & Nhận xét Báo cáo</h3>
                    <p className="text-sm text-gray-500">Ngày {report.date}</p>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6">
                        <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung nhận xét
                        </label>
                        <textarea
                            id="reviewComment"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            placeholder="Nhập nhận xét hoặc chỉ đạo của bạn..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
                            required
                        />
                    </main>
                    <footer className="p-4 border-t flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

// Helper components for displaying project info
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-primary border-b-2 border-primary/20 pb-2 mb-4">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm items-start">
        <dt className="font-medium text-gray-500 flex items-center">
            {icon && <span className="mr-2 text-gray-400">{icon}</span>}
            {label}
        </dt>
        <dd className="text-gray-900 md:col-span-2">
            {value ? (
                value
            ) : (
                <span className="italic text-red-600 bg-red-100 px-2 py-0.5 rounded-md font-medium">Chưa có thông tin</span>
            )}
        </dd>
    </div>
);


const DateSectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const ContactCard: React.FC<{ title: string; details: { label: string; value: string; icon?: React.ReactNode }[] }> = ({ title, details }) => (
    <div className="p-4 bg-gray-50 rounded-md border h-full">
        <h5 className="font-semibold text-gray-800 mb-3 text-base">{title}</h5>
        <div className="space-y-2">
            {details.map(item => <DetailItem key={item.label} label={item.label} value={item.value} icon={item.icon} />)}
        </div>
    </div>
);


interface ProjectDetailsProps {
    project: Project;
    currentUser: User | null;
    users: User[];
    onBack: () => void;
    onAddReport: (reportData: Omit<DailyReport, 'id'>) => Promise<void>;
    onUpdateProject: (projectData: Project) => Promise<void>;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onUpdateReport: (reportData: DailyReport) => Promise<void>;
    onDeleteReport: (reportId: string, projectId: string) => Promise<void>;
    onAddReportReview: (projectId: string, reportId: string, comment: string, user: User) => Promise<void>;
    // Document Management Props
    files: ProjectFile[];
    folders: ProjectFolder[];
    isFilesLoading: boolean;
    onUploadFiles: (files: File[], projectId: string, path: string) => void;
    onCreateFolder: (folderName: string, projectId: string, path: string) => void;
    onDeleteFile: (file: ProjectFile, projectId: string) => void;
    onDeleteFolder: (folder: ProjectFolder, projectId: string) => void;
    onBulkDelete: (items: { files: ProjectFile[], folders: ProjectFolder[] }, projectId: string) => void;
    uploadProgress: Record<string, { progress: number; name: string }>;
}

type DetailsView = 'details' | 'editProject' | 'addReport' | 'editReport';
type ActiveTab = 'reports' | 'approvals' | 'workItems' | 'info' | 'documents';

const getDefaultTabForRole = (role: Role | null): ActiveTab => {
    switch (role) {
        case Role.ProjectManager:
        case Role.DepartmentHead:
            return 'reports';
        case Role.LeadSupervisor:
        default:
            return 'reports';
    }
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
    project,
    currentUser,
    users,
    onBack,
    onAddReport,
    onUpdateProject,
    onDeleteProject,
    onUpdateReport,
    onDeleteReport,
    onAddReportReview,
    // Document Management Props
    files,
    folders,
    isFilesLoading,
    onUploadFiles,
    onCreateFolder,
    onDeleteFile,
    onDeleteFolder,
    onBulkDelete,
    uploadProgress
}) => {
    const [reports, setReports] = useState<(DailyReport & { managerReview?: ProjectReview })[]>([]);
    const [isReportsLoading, setIsReportsLoading] = useState(true);
    const [view, setView] = useState<DetailsView>('details');
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => getDefaultTabForRole(currentUser?.role || null));
    const [selectedReportToEdit, setSelectedReportToEdit] = useState<DailyReport | null>(null);
    const [reportToDelete, setReportToDelete] = useState<{ id: string; date: string } | null>(null);
    const [reportToReview, setReportToReview] = useState<DailyReport | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [displayedAiSummary, setDisplayedAiSummary] = useState<string>('');
    const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [viewingReport, setViewingReport] = useState<(DailyReport & { managerReview?: ProjectReview }) | null>(null);
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
    const [isAdvancedToolsVisible, setIsAdvancedToolsVisible] = useState(false);
    const [mobileAdvancedTab, setMobileAdvancedTab] = useState<'summary' | 'calendar' | 'stats'>('summary');


    // Effect for fetching reports for the current project
    useEffect(() => {
        if (!project.id) return;

        setIsReportsLoading(true);
        const reportsQuery = db.collection('reports').where('projectId', '==', project.id);

        const unsubscribe = reportsQuery.onSnapshot(snapshot => {
            const reviewsMap = project.reviews || {};
            const fetchedReports = snapshot.docs.map(doc => {
                const report = { id: doc.id, ...doc.data() } as DailyReport;
                return {
                    ...report,
                    managerReview: reviewsMap[report.id],
                };
            }).sort((a, b) => { // Sort by date DD/MM/YYYY descending
                const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
            });

            setReports(fetchedReports);
            setIsReportsLoading(false);
        }, error => {
            console.error("Error fetching reports for project:", error);
            setIsReportsLoading(false);
        });

        return () => unsubscribe();
    }, [project.id, project.reviews]); // Re-run if project ID changes or reviews are updated


    // AI typing effect
    useEffect(() => {
        if (aiSummary) {
            setDisplayedAiSummary('');
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedAiSummary(prev => prev + aiSummary.charAt(i));
                i++;
                if (i > aiSummary.length) {
                    clearInterval(interval);
                }
            }, 10); // Adjust typing speed here
            return () => clearInterval(interval);
        }
    }, [aiSummary]);
    
    useEffect(() => {
        setAiSummary('');
        setDisplayedAiSummary('');
        setActiveTab(getDefaultTabForRole(currentUser?.role || null));
        setSelectedDateFilter(null); // Reset filter when project changes
        setIsAdvancedToolsVisible(false); // Collapse tools on project change
        setMobileAdvancedTab('summary'); // Reset mobile tab on project change
    }, [project.id, currentUser?.role]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        setDisplayedAiSummary('');
        try {
            const summary = await generateProjectSummary(project, reports);
            setAiSummary(summary);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setAiSummary("Đã xảy ra lỗi khi tạo tóm tắt. Vui lòng thử lại.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    const handleEditReport = (report: DailyReport) => {
        setViewingReport(null); // Close details modal first
        setSelectedReportToEdit(report);
        setView('editReport');
    };
    
    const handleDeleteReportConfirm = (reportId: string, reportDate: string) => {
        setViewingReport(null);
        setReportToDelete({ id: reportId, date: reportDate });
    };

    const executeDeleteReport = async () => {
        if (reportToDelete) {
            await onDeleteReport(reportToDelete.id, project.id);
            setReportToDelete(null);
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        await onUpdateReport(reportData);
        setView('details');
        setSelectedReportToEdit(null);
    };

    const handleUpdateProject = async (projectData: Project) => {
        await onUpdateProject(projectData);
        setView('details');
    };

    const handleImageClick = (images: string[], startIndex: number) => {
        setLightboxImages(images);
        setLightboxIndex(startIndex);
    };

    const handleStartReview = (report: DailyReport) => {
      setViewingReport(null);
      setReportToReview(report);
    };
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
    const canAddReport = useMemo(() => permissions.canAddReport(currentUser, project), [currentUser, project]);
    const canEditProject = useMemo(() => permissions.canEditProject(currentUser, project), [currentUser, project]);
    const canViewApprovals = useMemo(() => permissions.canViewApprovalsTab(currentUser), [currentUser]);
    const canAccessDocuments = useMemo(() => permissions.canAccessDocuments(currentUser, project), [currentUser, project]);
    const canUseAi = useMemo(() => permissions.canUseAiSummary(currentUser), [currentUser]);

    const projectManagers = useMemo(() => 
        users.filter(u => project.projectManagerIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>,
    [users, project.projectManagerIds]);

    const leadSupervisors = useMemo(() => 
        users.filter(u => project.leadSupervisorIds.includes(u.id)).map(u => u.name).join(', ') || <span className="italic text-gray-400">Chưa gán</span>,
    [users, project.leadSupervisorIds]);
    
    const reportDatesSet = useMemo(() => new Set(reports.map(r => r.date)), [reports]);

    const filteredReports = useMemo(() => {
        if (!selectedDateFilter) return reports;
        return reports.filter(r => r.date === selectedDateFilter);
    }, [reports, selectedDateFilter]);


    if (view === 'editProject') {
        return (
            <EditProjectForm
                project={project}
                users={users}
                currentUser={currentUser}
                onUpdateProject={handleUpdateProject}
                onCancel={() => setView('details')}
            />
        );
    }

    if (view === 'addReport') {
        if (!currentUser) return null;
        return (
            <AddReportForm
                projectId={project.id}
                currentUser={currentUser}
                onAddReport={async (data) => {
                    await onAddReport(data);
                    setView('details');
                }}
                onCancel={() => setView('details')}
            />
        );
    }
    
    if (view === 'editReport' && selectedReportToEdit) {
        return (
            <EditReportForm
                report={selectedReportToEdit}
                onUpdateReport={handleUpdateReport}
                onCancel={() => {
                    setView('details');
                    setSelectedReportToEdit(null);
                }}
            />
        );
    }
    
    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 sm:px-5 py-2 font-semibold text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 ${
                activeTab === tabName
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-600 hover:bg-primary/10 hover:text-primary'
            }`}
        >
            {label}
        </button>
    );
    
    // Helper component for mobile tabs in the advanced tools section
    const TabButtonMobile: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`${
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
        >
            {children}
        </button>
    );

    const aiSummaryContent = (
        <>
            <h3 className="text-xl font-bold text-primary mb-4">Tóm tắt tiến độ bằng AI</h3>
            <div className="prose prose-sm max-w-none text-gray-800 mb-4 whitespace-pre-wrap min-h-[100px]">{displayedAiSummary || (isGeneratingSummary ? 'AI đang phân tích...' : 'Bấm nút để tạo tóm tắt.')}</div>
            <button onClick={handleGenerateSummary} disabled={isGeneratingSummary || reports.length === 0} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 disabled:bg-gray-400">
                {isGeneratingSummary ? 'Đang tạo...' : 'Tạo tóm tắt'}
            </button>
            {reports.length === 0 && <p className="text-xs text-gray-500 mt-2 italic">Cần có ít nhất một báo cáo để tạo tóm tắt.</p>}
        </>
    );

    const calendarContent = (
        <>
            <h3 className="text-xl font-bold text-primary mb-4">Lịch báo cáo</h3>
            <CalendarView 
                reportDates={reportDatesSet}
                onDateSelect={(date) => setSelectedDateFilter(date)}
                selectedDate={selectedDateFilter}
            />
        </>
    );

    return (
      <div className="animate-fade-in">
        <header className="mb-6">
            <button onClick={onBack} className="text-secondary hover:text-accent font-semibold flex items-center mb-4">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Trở về Dashboard
            </button>
            <div className="flex justify-between items-start flex-wrap gap-4">
                 <button 
                    onClick={() => canUseAi && setIsAdvancedToolsVisible(prev => !prev)}
                    className={`flex items-center gap-3 text-left ${canUseAi ? 'cursor-pointer group' : ''}`}
                    aria-expanded={isAdvancedToolsVisible}
                    aria-controls="advanced-tools-panel"
                    disabled={!canUseAi}
                >
                    <h2 className="text-3xl font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight">{project.name}</h2>
                    {canUseAi && (
                       <TuneIcon className={`h-6 w-6 transition-colors duration-300 ${isAdvancedToolsVisible ? 'text-accent' : 'text-gray-400 group-hover:text-primary'}`} />
                    )}
                </button>
                <div className="flex gap-2 sm:gap-4">
                    {canEditProject && (
                        <button onClick={() => setView('editProject')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                            Chỉnh sửa Dự án
                        </button>
                    )}
                    {canAddReport && (
                        <button onClick={() => setView('addReport')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                            Thêm Báo cáo +
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div className="mb-6">
            <nav className="flex space-x-2 p-1 bg-gray-200/70 rounded-lg max-w-max" aria-label="Tabs">
                <TabButton tabName="reports" label="Báo cáo" />
                {canViewApprovals && <TabButton tabName="approvals" label="Phê duyệt" />}
                {canAccessDocuments && <TabButton tabName="documents" label="Tài liệu" />}
                <TabButton tabName="workItems" label="Bảng tiến độ thi công" />
                <TabButton tabName="info" label="Thông tin" />
            </nav>
        </div>

        <div>
            {activeTab === 'reports' && (
                <div className="space-y-6">
                     <div 
                        id="advanced-tools-panel"
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${isAdvancedToolsVisible ? 'max-h-[1000px] lg:max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                     >
                        {canUseAi && (
                           <>
                                {/* --- DESKTOP VIEW: GRID --- */}
                                <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">{aiSummaryContent}</div>
                                    <div className="bg-base-100 p-6 rounded-lg shadow-md border border-gray-200">{calendarContent}</div>
                                    <ProjectStats reports={reports} />
                                </div>
    
                                {/* --- MOBILE VIEW: TABS --- */}
                                <div className="lg:hidden mb-6 bg-base-100 rounded-lg shadow-md border border-gray-200">
                                    <div className="border-b border-gray-200">
                                        <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                                            <TabButtonMobile active={mobileAdvancedTab === 'summary'} onClick={() => setMobileAdvancedTab('summary')}>Tóm tắt AI</TabButtonMobile>
                                            <TabButtonMobile active={mobileAdvancedTab === 'calendar'} onClick={() => setMobileAdvancedTab('calendar')}>Lịch</TabButtonMobile>
                                            <TabButtonMobile active={mobileAdvancedTab === 'stats'} onClick={() => setMobileAdvancedTab('stats')}>Thống kê</TabButtonMobile>
                                        </nav>
                                    </div>
                                    <div>
                                        {mobileAdvancedTab === 'summary' && <div className="p-6">{aiSummaryContent}</div>}
                                        {mobileAdvancedTab === 'calendar' && <div className="p-6">{calendarContent}</div>}
                                        {mobileAdvancedTab === 'stats' && <ProjectStats reports={reports} />}
                                    </div>
                                </div>
                           </>
                        )}
                    </div>

                    {selectedDateFilter && (
                        <div className="flex justify-center items-center gap-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">
                                Đang hiển thị báo cáo cho ngày: {selectedDateFilter}
                            </p>
                            <button 
                                onClick={() => setSelectedDateFilter(null)}
                                className="bg-white text-blue-700 text-xs font-bold py-1 px-3 rounded-full border border-blue-300 hover:bg-blue-100"
                            >
                                Xem tất cả
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {isReportsLoading ? (
                            [...Array(12)].map((_, i) => <ReportCardSkeleton key={i} />)
                        ) : filteredReports.length > 0 ? (
                            filteredReports.map((report, index) => {
                                // Find the correct previous report from the original sorted 'reports' array
                                const originalIndex = reports.findIndex(r => r.id === report.id);
                                const previousReport = reports[originalIndex + 1];
                                const previousProgress = previousReport?.progressPercentage ?? 0;
                                return (
                                    <ReportCard 
                                        key={report.id} 
                                        report={report}
                                        onViewDetails={() => setViewingReport(report)}
                                        review={report.managerReview}
                                        reviewerName={report.managerReview?.reviewedByName}
                                        previousProgressPercentage={previousProgress}
                                    />
                                );
                            })
                        ) : (
                            <p className="col-span-full text-center text-gray-500 py-8">
                                {selectedDateFilter ? `Không có báo cáo nào cho ngày ${selectedDateFilter}.` : 'Chưa có báo cáo nào cho dự án này.'}
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'approvals' && canViewApprovals && (
                <div className="animate-fade-in">
                    <ApprovalTimeline project={project} />
                    <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <DateSectionCard title="1. Giao danh mục">
                                <DetailItem label="Số QĐ giao" value={project.capitalPlanApproval?.decisionNumber} />
                                <DetailItem label="Ngày giao DM" value={project.capitalPlanApproval?.date} />
                            </DateSectionCard>

                            <DateSectionCard title="2. Đấu thầu: Tư vấn thiết kế">
                            <DetailItem label="Ngày P.hành HSMT" value={project.designBidding?.itbIssuanceDate} />
                            <DetailItem label="Ngày ký Hợp đồng" value={project.designBidding?.contractSignDate} />
                            </DateSectionCard>

                            <DateSectionCard title="3. Phê duyệt: Phương án kỹ thuật">
                                <DetailItem label="Ngày nộp" value={project.technicalPlanStage?.submissionDate} />
                                <DetailItem label="Ngày duyệt" value={project.technicalPlanStage?.approvalDate} />
                            </DateSectionCard>

                            <DateSectionCard title="4. Phê duyệt: Dự toán">
                                <DetailItem label="Ngày nộp" value={project.budgetStage?.submissionDate} />
                                <DetailItem label="Ngày duyệt" value={project.budgetStage?.approvalDate} />
                            </DateSectionCard>

                            <DateSectionCard title="5. Đấu thầu: Giám sát thi công">
                                <DetailItem label="Ngày P.hành HSMT" value={project.supervisionBidding?.itbIssuanceDate} />
                                <DetailItem label="Ngày ký Hợp đồng" value={project.supervisionBidding?.contractSignDate} />
                            </DateSectionCard>

                            <DateSectionCard title="6. Đấu thầu: Thi công sửa chữa">
                                <DetailItem label="Ngày P.hành HSMT" value={project.constructionBidding?.itbIssuanceDate} />
                                <DetailItem label="Ngày ký Hợp đồng" value={project.constructionBidding?.contractSignDate} />
                            </DateSectionCard>
                            
                            <DateSectionCard title="7. Triển khai thi công">
                                <DetailItem label="Ngày triển khai" value={project.constructionStartDate} />
                                <DetailItem label="Ngày nghiệm thu KH" value={project.plannedAcceptanceDate} />
                            </DateSectionCard>

                            <DateSectionCard title="8. Quyết toán">
                                <DetailItem label="Ngày nộp" value={project.finalSettlementStage?.submissionDate} />
                                <DetailItem label="Ngày duyệt" value={project.finalSettlementStage?.approvalDate} />
                            </DateSectionCard>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'documents' && canAccessDocuments && (
                <Suspense fallback={<LoadingSpinner />}>
                    <DocumentManager 
                        project={project} 
                        currentUser={currentUser} 
                        files={files}
                        folders={folders}
                        onUploadFiles={onUploadFiles}
                        onCreateFolder={onCreateFolder}
                        onDeleteFile={onDeleteFile}
                        onDeleteFolder={onDeleteFolder}
                        onBulkDelete={onBulkDelete}
                        uploadProgress={uploadProgress}
                    />
                </Suspense>
            )}

            {activeTab === 'workItems' && (
                 <div className="bg-base-100 rounded-lg shadow-md border border-gray-200 animate-fade-in overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-white">
                        <h3 className="text-xl font-bold text-primary">Bảng tiến độ thi công</h3>
                        {project.scheduleSheetEditUrl && (
                            <a 
                                href={project.scheduleSheetEditUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                            >
                                <ExternalLinkIcon className="h-5 w-5" />
                                Mở để Chỉnh sửa
                            </a>
                        )}
                    </div>
                    <div>
                        {project.scheduleSheetUrl ? (
                             <iframe src={project.scheduleSheetUrl} className="w-full h-[70vh] border-none" title="Bảng tiến độ thi công"></iframe>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>Chưa có kế hoạch tiến độ nào được thêm vào.</p>
                                {canEditProject && <p className="mt-2 text-sm">Vui lòng vào mục "Chỉnh sửa dự án" để thêm link nhúng từ Google Sheet.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'info' && (
                <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 animate-fade-in">
                    {currentUser?.role === Role.Admin && (
                        <DetailSection title="Nhân sự Phụ trách (Phân quyền)">
                            <DetailItem label="Cán bộ Quản lý" value={projectManagers} icon={<UserGroupIcon />} />
                            <DetailItem label="Giám sát trưởng" value={leadSupervisors} icon={<UserGroupIcon />} />
                        </DetailSection>
                    )}

                     <DetailSection title="Thông tin các Đơn vị & Cán bộ">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ContactCard title="Đơn vị Thiết kế" details={[
                                { label: "Công ty", value: project.designUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Chủ nhiệm", value: project.designUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.designUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Đơn vị Thi công" details={[
                                { label: "Công ty", value: project.constructionUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Chỉ huy trưởng", value: project.constructionUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.constructionUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                             <ContactCard title="Đơn vị Giám sát" details={[
                                { label: "Công ty", value: project.supervisionUnit?.companyName, icon: <CompanyIcon /> },
                                { label: "Giám sát trưởng", value: project.supervisionUnit?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.supervisionUnit?.phone, icon: <PhoneIcon /> },
                            ]} />
                            {project.projectManagementUnits && project.projectManagementUnits.length > 0 ? (
                                project.projectManagementUnits.map((unit, index) => (
                                    <ContactCard 
                                        key={`pm-unit-${index}`} 
                                        title={`Cán bộ QLDA ${project.projectManagementUnits.length > 1 ? `#${index + 1}` : ''}`} 
                                        details={[
                                            { label: "Phòng", value: unit.departmentName, icon: <CompanyIcon /> },
                                            { label: "Cán bộ", value: unit.personnelName, icon: <UserCircleIcon /> },
                                            { label: "SĐT", value: unit.phone, icon: <PhoneIcon /> },
                                        ]} 
                                    />
                                ))
                            ) : (
                                <ContactCard 
                                    title="Cán bộ QLDA" 
                                    details={[
                                        { label: "Phòng", value: undefined, icon: <CompanyIcon /> },
                                        { label: "Cán bộ", value: undefined, icon: <UserCircleIcon /> },
                                        { label: "SĐT", value: undefined, icon: <PhoneIcon /> },
                                    ]} 
                                />
                            )}
                             <ContactCard title="Giám sát A (QLVH)" details={[
                                { label: "XNDV", value: project.supervisorA?.enterpriseName, icon: <CompanyIcon /> },
                                { label: "Cán bộ", value: project.supervisorA?.personnelName, icon: <UserCircleIcon /> },
                                { label: "SĐT", value: project.supervisorA?.phone, icon: <PhoneIcon /> },
                            ]} />
                        </div>
                    </DetailSection>
                </div>
            )}
        </div>

        {reportToDelete && (
            <ConfirmationModal 
                message={`Bạn có chắc chắn muốn xóa báo cáo ngày ${reportToDelete.date}?`}
                onConfirm={executeDeleteReport}
                onCancel={() => setReportToDelete(null)}
            />
        )}
        {reportToReview && currentUser && (
            <ReviewReportModal 
                report={reportToReview}
                currentUser={currentUser}
                onClose={() => setReportToReview(null)}
                onAddReview={onAddReportReview}
            />
        )}
        {lightboxImages && (
            <ImageLightbox 
                images={lightboxImages}
                startIndex={lightboxIndex}
                onClose={() => setLightboxImages(null)}
            />
        )}
        {viewingReport && (() => {
            const reportIndex = reports.findIndex(r => r.id === viewingReport.id);
            const previousReport = reports[reportIndex + 1];
            const previousProgress = previousReport?.progressPercentage ?? 0;
            return (
                <ReportDetailsModal 
                    report={viewingReport}
                    project={project}
                    currentUser={currentUser}
                    review={viewingReport.managerReview}
                    reviewerName={viewingReport.managerReview?.reviewedByName}
                    onClose={() => setViewingReport(null)}
                    onEdit={handleEditReport}
                    onDelete={handleDeleteReportConfirm}
                    onReview={handleStartReview}
                    onImageClick={handleImageClick}
                    previousProgressPercentage={previousProgress}
                />
            );
        })()}
      </div>
    );
};

export default ProjectDetails;