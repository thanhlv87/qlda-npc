import React from 'react';
import type { DailyReport, Project, ProjectReview, User } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { XIcon } from './Icons.tsx';
import LazyImage from './LazyImage.tsx';

interface ReportDetailsModalProps {
  report: DailyReport;
  project: Project;
  currentUser: User | null;
  reviews?: ProjectReview[];
  onClose: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (reportId: string, reportDate: string) => void;
  onReview: (report: DailyReport) => void;
  onDeleteReview: (projectId: string, reportId: string, review: ProjectReview) => Promise<void>;
  onImageClick: (images: string[], startIndex: number) => void;
  previousProgressPercentage?: number;
}

const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  project,
  currentUser,
  reviews = [],
  onClose,
  onEdit,
  onDelete,
  onReview,
  onDeleteReview,
  onImageClick,
  previousProgressPercentage,
}) => {
  const canEdit = permissions.canEditReport(currentUser, project);
  const canDelete = permissions.canDeleteReport(currentUser, project);
  const canReview = permissions.canReviewReport(currentUser, project);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-base-100 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
          <div>
            <h3 className="text-xl font-bold text-primary dark:text-blue-400">Chi tiết Báo cáo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ngày {report.date} - Bởi: {report.submittedBy}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow space-y-6">
          <section>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Tiến độ hoàn thành</h4>
            { (report.progressPercentage !== undefined && report.progressPercentage !== null) ? (() => {
                const currentProgress = report.progressPercentage || 0;
                const previousProgress = previousProgressPercentage || 0;
                const progressToday = Math.max(0, currentProgress - previousProgress);
                return (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border dark:border-gray-700">
                        <div className="flex justify-between items-baseline text-sm mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Tổng tiến độ</span>
                            <span className="font-bold text-2xl text-secondary dark:text-blue-400">{currentProgress}%</span>
                        </div>
                        {/* FIX: Changed aria-valuemin and aria-valuemax from strings to numbers to match TypeScript definitions. */}
                        <div className="w-full flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 my-2" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
                            <div
                                className="bg-red-500 dark:bg-red-600 transition-all duration-300"
                                style={{ width: `${previousProgress}%` }}
                                title={`Hoàn thành đến hôm qua: ${previousProgress}%`}
                            ></div>
                            <div
                                className="bg-green-500 dark:bg-green-600 transition-all duration-300"
                                style={{ width: `${progressToday}%` }}
                                title={`Hoàn thành hôm nay: +${progressToday.toFixed(1)}%`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Hôm qua: {previousProgress}%</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">Hôm nay: +{progressToday.toFixed(1)}%</span>
                        </div>
                    </div>
                );
            })() : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Không có dữ liệu tiến độ cho báo cáo này.</p>
            )}
        </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Nhân lực & Thiết bị</h4>
            {(report.personnelCount !== undefined && report.personnelCount !== null) || report.equipmentOnSite ? (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border dark:border-gray-700 space-y-3 text-sm">
                    {(report.personnelCount !== undefined && report.personnelCount !== null) && (
                        <div>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">Số lượng nhân lực:</span>
                            <span className="text-gray-800 dark:text-gray-200 ml-2">{report.personnelCount} người</span>
                        </div>
                    )}
                    {report.equipmentOnSite && (
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Thiết bị máy móc:</p>
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap pl-2 border-l-2 border-gray-200 dark:border-gray-600">{report.equipmentOnSite}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Không có thông tin về nhân lực và thiết bị.</p>
            )}
        </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Nội dung công việc</h4>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.tasks}</p>
          </section>

          {report.images.length > 0 && (
            <section>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {report.images.map((image, index) => (
                  <div key={index} className="relative group cursor-pointer" onClick={() => onImageClick(report.images, index)}>
                    <LazyImage
                      src={image}
                      alt={`Hình ảnh báo cáo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
             <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Xác nhận & Nhận xét ({reviews.length})</h4>
             {reviews.length > 0 ? (
                 <div className="space-y-3 max-h-64 overflow-y-auto">
                   {reviews.map((rev) => (
                     <div key={rev.id} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 text-green-800 dark:text-green-300 p-4 rounded-r-lg relative">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-sm">✔️ {rev.reviewedByName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(rev.reviewedAt).toLocaleString('vi-VN')}</p>
                            <p className="text-sm italic mt-1 whitespace-pre-wrap">"{rev.comment}"</p>
                          </div>
                          {currentUser && (rev.reviewedById === currentUser.id || currentUser.role === 'Admin') && (
                            <button
                              onClick={() => onDeleteReview(project.id, report.id, rev)}
                              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-semibold"
                              title="Xóa nhận xét"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                     </div>
                   ))}
                 </div>
             ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa có nhận xét nào.</p>
             )}
          </section>
        </main>

        {(canEdit || canDelete || canReview) && (
            <footer className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3 rounded-b-lg border-t dark:border-gray-700 sticky bottom-0">
              {canReview && (
                 <button
                    onClick={() => onReview(report)}
                    className="bg-blue-600 dark:bg-blue-700 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                    Thêm Nhận xét
                </button>
              )}
              {canEdit && (
                <button onClick={() => onEdit(report)} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Chỉnh sửa
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(report.id, report.date)} className="bg-error text-white font-bold py-2 px-4 rounded-md hover:opacity-90">
                    Xóa
                </button>
              )}
            </footer>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsModal;