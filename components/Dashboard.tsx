import React, { useState, useMemo, Suspense, lazy } from 'react';
import type { User, Project } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import type { AppView } from '../App.tsx';

// Icons
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ClockIcon, PencilSquareIcon, HardHatIcon, DocumentCheckIcon, TrophyIcon, ExclamationTriangleIcon, PauseIcon, CogIcon, RectangleStackIcon } from './Icons.tsx';

// Components
import ProjectCard from './ProjectCard.tsx';
import ProjectCardSkeleton from './ProjectCardSkeleton.tsx';
const OverallTimeline = lazy(() => import('./OverallTimeline.tsx'));

interface DashboardProps {
    currentUser: User;
    projects: Project[];
    users: User[];
    isProjectsLoading: boolean;
    onSelectProject: (projectId: string) => void;
    onDeleteProject: (projectId: string, projectName: string) => void;
    onNavigate: (view: AppView) => void;
    onApproveUser: (user: User) => void;
}

type ProjectPhase = 'investment' | 'construction' | 'settlement';
type ProjectStatusFilter = 'total' | 'inProgress' | 'onTime' | 'dueSoon' | 'delayed' | 'notStarted' | 'completed';

// --- Helper Functions ---
const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? null : date;
};

const diffDays = (start: Date, end: Date): number => {
    const difference = end.getTime() - start.getTime();
    return Math.round(difference / (1000 * 60 * 60 * 24));
};


// --- Sub-components for Dashboard ---

const PhaseCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    count: number;
    onClick: () => void;
    isActive: boolean;
    colorTheme: {
        inactiveBg: string;
        inactiveText: string;
        inactiveIconBg: string;
    };
}> = ({ title, description, icon, count, onClick, isActive, colorTheme }) => {
    const activeClasses = 'bg-primary text-white shadow-lg';
    const inactiveClasses = `${colorTheme.inactiveBg} hover:shadow-md`;

    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-xl text-left transition-all duration-300 transform hover:-translate-y-1 ${isActive ? activeClasses : inactiveClasses}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                     <div className={`p-3 rounded-lg ${isActive ? 'bg-white/20' : colorTheme.inactiveIconBg}`}>
                        <div className={`h-8 w-8 ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{icon}</div>
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{title}</h3>
                        <p className={`mt-1 text-sm ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>{description}</p>
                    </div>
                </div>
                 <div className={`text-4xl font-bold ${isActive ? 'text-white' : colorTheme.inactiveText}`}>{count}</div>
            </div>
        </button>
    );
};


interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    isActive: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-lg shadow-md flex items-center space-x-4 border-l-4 w-full text-left transition-all duration-200 transform ${isActive ? 'shadow-xl -translate-y-1' : 'bg-base-100 hover:shadow-xl hover:-translate-y-1'}`}
        style={{ 
            borderColor: color,
            backgroundColor: isActive ? color : undefined,
        }}
        aria-pressed={isActive}
    >
        <div 
            className="p-3 rounded-full transition-colors duration-200" 
            style={{ backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : `${color}1A` }}
        >
            <div className="h-6 w-6 transition-colors duration-200" style={{ color: isActive ? 'white' : color }}>
                {icon}
            </div>
        </div>
        <div>
            <p className={`text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white/90' : 'text-gray-500'}`}>{title}</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-800'}`}>{value}</p>
        </div>
    </button>
);


// --- Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({
    currentUser,
    projects,
    users,
    isProjectsLoading,
    onSelectProject,
    onDeleteProject,
    onNavigate,
    onApproveUser,
}) => {
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [selectedTimelineProjectIds, setSelectedTimelineProjectIds] = useState<string[]>([]);
    const [activePhase, setActivePhase] = useState<ProjectPhase | null>(null);
    const [activeFilter, setActiveFilter] = useState<ProjectStatusFilter>('total');
    
    // Default timeline selection to all projects when they load
    React.useEffect(() => {
        if (projects.length > 0) {
            setSelectedTimelineProjectIds(projects.map(p => p.id));
        }
    }, [projects]);
    
    const handlePhaseChange = (phase: ProjectPhase) => {
        setActivePhase(prevPhase => (prevPhase === phase ? null : phase));
        setActiveFilter('total'); // Always reset sub-filter when phase changes or is toggled off
    };
    
    const handleFilterClick = (filter: ProjectStatusFilter) => {
        if (filter === 'total') {
            return; // The 'Total' card is just an indicator.
        }
        // Toggle between the selected filter and the 'total' (all) view.
        setActiveFilter(prevFilter => (prevFilter === filter ? 'total' : filter));
    };

    const { categorizedProjects, phaseStats } = useMemo(() => {
        const categories: Record<ProjectPhase, Project[]> = {
            investment: [],
            construction: [],
            settlement: [],
        };

        const stats: Record<ProjectPhase, Record<ProjectStatusFilter, number>> = {
            investment: { total: 0, inProgress: 0, delayed: 0, completed: 0, onTime:0, dueSoon:0, notStarted:0 },
            construction: { total: 0, onTime: 0, dueSoon: 0, delayed: 0, notStarted: 0, inProgress:0, completed:0 },
            settlement: { total: 0, inProgress: 0, delayed: 0, completed: 0, onTime:0, dueSoon:0, notStarted:0 },
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const project of projects) {
            const constructionStartDate = parseDate(project.constructionStartDate);
            const plannedAcceptanceDate = parseDate(project.plannedAcceptanceDate);
            const settlementSubmissionDate = parseDate(project.finalSettlementStage?.submissionDate);
            const settlementApprovalDate = parseDate(project.finalSettlementStage?.approvalDate);

            // 1. Categorize project into a phase
            if (settlementSubmissionDate) {
                categories.settlement.push(project);
            } else if (constructionStartDate && today >= constructionStartDate) {
                categories.construction.push(project);
            } else {
                categories.investment.push(project);
            }
        }
        
        // 2. Calculate stats for each phase
        // Investment Phase
        stats.investment.total = categories.investment.length;
        for (const p of categories.investment) {
            const techSubmit = parseDate(p.technicalPlanStage?.submissionDate);
            const techApprove = parseDate(p.technicalPlanStage?.approvalDate);
            const budgetSubmit = parseDate(p.budgetStage?.submissionDate);
            const budgetApprove = parseDate(p.budgetStage?.approvalDate);
            const constractSigned = parseDate(p.constructionBidding?.contractSignDate);

            let isDelayed = false;
            if (techSubmit && !techApprove && diffDays(techSubmit, today) > 30) isDelayed = true;
            if (budgetSubmit && !budgetApprove && diffDays(budgetSubmit, today) > 30) isDelayed = true;
            
            if (constractSigned) stats.investment.completed++;
            else if (isDelayed) stats.investment.delayed++;
            else stats.investment.inProgress++;
        }

        // Construction Phase
        stats.construction.total = categories.construction.length;
        for (const p of categories.construction) {
            const startDate = parseDate(p.constructionStartDate);
            const endDate = parseDate(p.plannedAcceptanceDate);
            if (!startDate || !endDate) continue;

            if (today < startDate) {
                stats.construction.notStarted++;
            } else {
                const daysRemaining = diffDays(today, endDate);
                if (daysRemaining < 0) stats.construction.delayed++;
                else if (daysRemaining <= 7) stats.construction.dueSoon++;
                else stats.construction.onTime++;
            }
        }
        
        // Settlement Phase
        stats.settlement.total = categories.settlement.length;
        for(const p of categories.settlement) {
            const acceptanceDate = parseDate(p.plannedAcceptanceDate);
            const approvalDate = parseDate(p.finalSettlementStage?.approvalDate);

            if(approvalDate) {
                stats.settlement.completed++;
            } else if (acceptanceDate && diffDays(acceptanceDate, today) > 90) {
                stats.settlement.delayed++;
            } else {
                stats.settlement.inProgress++;
            }
        }
        
        return { categorizedProjects: categories, phaseStats: stats };
    }, [projects]);


    const filteredProjects = useMemo(() => {
        if (!activePhase) {
            return projects; // Show all projects if no phase is selected
        }

        const projectsInPhase = categorizedProjects[activePhase];
        if (activeFilter === 'total') return projectsInPhase;

        return projectsInPhase.filter(project => {
            let status: ProjectStatusFilter = 'inProgress'; // Default status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (activePhase === 'investment') {
                const techSubmit = parseDate(project.technicalPlanStage?.submissionDate);
                const techApprove = parseDate(project.technicalPlanStage?.approvalDate);
                const budgetSubmit = parseDate(project.budgetStage?.submissionDate);
                const budgetApprove = parseDate(project.budgetStage?.approvalDate);
                const constractSigned = parseDate(project.constructionBidding?.contractSignDate);

                let isDelayed = false;
                if (techSubmit && !techApprove && diffDays(techSubmit, today) > 30) isDelayed = true;
                if (budgetSubmit && !budgetApprove && diffDays(budgetSubmit, today) > 30) isDelayed = true;
                
                if (constractSigned) status = 'completed';
                else if (isDelayed) status = 'delayed';
                else status = 'inProgress';
            }
            else if (activePhase === 'construction') {
                const startDate = parseDate(project.constructionStartDate);
                const endDate = parseDate(project.plannedAcceptanceDate);
                if (!startDate || !endDate) return false;

                if (today < startDate) status = 'notStarted';
                else {
                    const daysRemaining = diffDays(today, endDate);
                    if (daysRemaining < 0) status = 'delayed';
                    else if (daysRemaining <= 7) status = 'dueSoon';
                    else status = 'onTime';
                }
            }
            else if (activePhase === 'settlement') {
                const acceptanceDate = parseDate(project.plannedAcceptanceDate);
                const approvalDate = parseDate(project.finalSettlementStage?.approvalDate);
                if(approvalDate) status = 'completed';
                else if (acceptanceDate && diffDays(acceptanceDate, today) > 90) status = 'delayed';
                else status = 'inProgress';
            }
            return status === activeFilter;
        });
    }, [activePhase, activeFilter, categorizedProjects, projects]);
    
    const timelineProjects = useMemo(() => {
        return projects.filter(p => selectedTimelineProjectIds.includes(p.id));
    }, [projects, selectedTimelineProjectIds]);

    const handleTimelineProjectToggle = (projectId: string) => {
        setSelectedTimelineProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleSelectAllProjectsForTimeline = () => {
        setSelectedTimelineProjectIds(projects.map(p => p.id));
    };

    const handleDeselectAllProjectsForTimeline = () => {
        setSelectedTimelineProjectIds([]);
    };

    const pendingUsers = useMemo(() => users.filter(u => !u.role), [users]);

    const renderStatCards = () => {
        if (!activePhase) return null; // Don't render stat cards if no phase is selected
        const stats = phaseStats[activePhase];
        switch (activePhase) {
            case 'investment':
                return (
                    <>
                        <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => handleFilterClick('total')} isActive={activeFilter === 'total'} />
                        <StatCard title="Đang thực hiện" value={stats.inProgress} icon={<CogIcon />} color="#3B82F6" onClick={() => handleFilterClick('inProgress')} isActive={activeFilter === 'inProgress'} />
                        <StatCard title="Chậm" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => handleFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
                        <StatCard title="Hoàn thành GĐ" value={stats.completed} icon={<TrophyIcon />} color="#10B981" onClick={() => handleFilterClick('completed')} isActive={activeFilter === 'completed'} />
                    </>
                );
            case 'construction':
                return (
                    <>
                        <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => handleFilterClick('total')} isActive={activeFilter === 'total'} />
                        <StatCard title="Đúng Tiến độ" value={stats.onTime} icon={<CheckCircleIcon />} color="#10B981" onClick={() => handleFilterClick('onTime')} isActive={activeFilter === 'onTime'} />
                        <StatCard title="Sắp đến hạn" value={stats.dueSoon} icon={<ClockIcon />} color="#F59E0B" onClick={() => handleFilterClick('dueSoon')} isActive={activeFilter === 'dueSoon'} />
                        <StatCard title="Chậm Tiến độ" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => handleFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
                        <StatCard title="Chưa Bắt đầu" value={stats.notStarted} icon={<PauseIcon />} color="#6B7280" onClick={() => handleFilterClick('notStarted')} isActive={activeFilter === 'notStarted'} />
                    </>
                );
            case 'settlement':
                 return (
                    <>
                        <StatCard title="Tổng số" value={stats.total} icon={<RectangleStackIcon />} color="#1E40AF" onClick={() => handleFilterClick('total')} isActive={activeFilter === 'total'} />
                        <StatCard title="Đang thực hiện" value={stats.inProgress} icon={<CogIcon />} color="#3B82F6" onClick={() => handleFilterClick('inProgress')} isActive={activeFilter === 'inProgress'} />
                        <StatCard title="Chậm" value={stats.delayed} icon={<ExclamationTriangleIcon />} color="#EF4444" onClick={() => handleFilterClick('delayed')} isActive={activeFilter === 'delayed'} />
                        <StatCard title="Đã quyết toán" value={stats.completed} icon={<TrophyIcon />} color="#10B981" onClick={() => handleFilterClick('completed')} isActive={activeFilter === 'completed'} />
                    </>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="animate-fade-in space-y-8">
            {/* Collapsible Timeline Section */}
            {permissions.canUseAiSummary(currentUser) && (
                <div className="bg-base-100 rounded-lg shadow-md border border-gray-200">
                    <button
                        onClick={() => setIsTimelineVisible(!isTimelineVisible)}
                        className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-primary hover:bg-neutral/50 rounded-lg"
                        aria-expanded={isTimelineVisible}
                    >
                        <span>Dòng thời gian Tổng thể các Dự án</span>
                        {isTimelineVisible 
                            ? <ChevronUpIcon className="h-6 w-6 transition-transform" /> 
                            : <ChevronDownIcon className="h-6 w-6 transition-transform" />
                        }
                    </button>
                    {isTimelineVisible && (
                        <div className="border-t border-gray-200 p-4">
                            <div className="mb-4 bg-gray-50 p-3 rounded-md border">
                                <h4 className="font-semibold text-gray-700 mb-2">Chọn dự án để hiển thị:</h4>
                                <div className="flex gap-4 mb-3">
                                    <button onClick={handleSelectAllProjectsForTimeline} className="text-sm text-secondary font-semibold hover:underline">Chọn tất cả</button>
                                    <button onClick={handleDeselectAllProjectsForTimeline} className="text-sm text-secondary font-semibold hover:underline">Bỏ chọn tất cả</button>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 max-h-24 overflow-y-auto">
                                    {projects.map(project => (
                                        <label key={project.id} className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTimelineProjectIds.includes(project.id)}
                                                onChange={() => handleTimelineProjectToggle(project.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary shrink-0"
                                            />
                                            <span className="whitespace-nowrap" title={project.name}>{project.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <Suspense fallback={<div className="text-center p-8">Đang tải dòng thời gian...</div>}>
                                <OverallTimeline projects={timelineProjects} onSelectProject={onSelectProject} />
                            </Suspense>
                        </div>
                    )}
                </div>
            )}
            
            {/* Phase Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PhaseCard 
                    title="Chuẩn bị đầu tư"
                    description="Các thủ tục, phê duyệt trước thi công."
                    icon={<PencilSquareIcon />}
                    count={categorizedProjects.investment.length}
                    onClick={() => handlePhaseChange('investment')}
                    isActive={activePhase === 'investment'}
                    colorTheme={{ inactiveBg: 'bg-cyan-50', inactiveText: 'text-cyan-800', inactiveIconBg: 'bg-cyan-100' }}
                />
                <PhaseCard 
                    title="Thi công"
                    description="Triển khai xây dựng tại hiện trường."
                    icon={<HardHatIcon />}
                    count={categorizedProjects.construction.length}
                    onClick={() => handlePhaseChange('construction')}
                    isActive={activePhase === 'construction'}
                    colorTheme={{ inactiveBg: 'bg-orange-50', inactiveText: 'text-orange-800', inactiveIconBg: 'bg-orange-100' }}
                />
                <PhaseCard 
                    title="Quyết toán"
                    description="Hoàn thiện hồ sơ, phê duyệt cuối cùng."
                    icon={<DocumentCheckIcon />}
                    count={categorizedProjects.settlement.length}
                    onClick={() => handlePhaseChange('settlement')}
                    isActive={activePhase === 'settlement'}
                    colorTheme={{ inactiveBg: 'bg-green-50', inactiveText: 'text-green-800', inactiveIconBg: 'bg-green-100' }}
                />
            </div>
            
             {/* Dynamic Stats Cards Section */}
            {activePhase && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {renderStatCards()}
                </div>
            )}

            {/* Pending Users Section */}
            {permissions.canManageUsers(currentUser) && pendingUsers.length > 0 && (
                <div className="p-4 sm:p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-4">Tài khoản chờ Phê duyệt ({pendingUsers.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                                <div>
                                    <p className="font-semibold text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                <button 
                                    onClick={() => onApproveUser(user)}
                                    className="bg-success text-white font-bold py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                                >
                                    Phê duyệt
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Project List Section */}
            <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-gray-800">Danh sách Dự án</h2>
                    <div className="flex gap-2 sm:gap-4">
                        {permissions.canManageUsers(currentUser) && (
                            <button onClick={() => onNavigate('userManagement')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                                Quản lý User
                            </button>
                        )}
                        {permissions.canAddProject(currentUser) && (
                            <button onClick={() => onNavigate('addProject')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                                Thêm Dự án +
                            </button>
                        )}
                    </div>
                </div>
                {isProjectsLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
                    </div>
                ) : (
                    filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    currentUser={currentUser}
                                    onSelectProject={onSelectProject}
                                    onDeleteProject={onDeleteProject}
                                />
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-8">
                            {projects.length > 0 ? 'Không có dự án nào khớp với bộ lọc này.' : 'Không có dự án nào để hiển thị.'}
                        </p>
                    )
                )}
            </div>
        </div>
    );
};

export default Dashboard;