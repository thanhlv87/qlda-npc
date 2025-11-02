const {onDocumentCreated, onDocumentUpdated} = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Helper function to get users who should be notified
async function getUsersToNotify(projectId) {
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) return [];

  const project = projectDoc.data();
  const userIdsToNotify = new Set();

  // Get all admins
  const adminsSnapshot = await db.collection('users').where('role', '==', 'Admin').get();
  adminsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

  // Get all department heads
  const deptHeadsSnapshot = await db.collection('users').where('role', '==', 'DepartmentHead').get();
  deptHeadsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

  // Get project managers
  if (project.projectManagerIds) {
    project.projectManagerIds.forEach(id => userIdsToNotify.add(id));
  }

 return Array.from(userIdsToNotify);
}

// Trigger when a new report is created
exports.onReportCreated = onDocumentCreated('reports/{reportId}', async (event) => {
  const report = event.data.data();
  const reportId = event.params.reportId;

  console.log(`New report created: ${reportId} for project: ${report.projectId}`);

  // Get project info
  const projectDoc = await db.collection('projects').doc(report.projectId).get();
  if (!projectDoc.exists) {
    console.log('Project not found');
    return null;
  }

  const project = projectDoc.data();
  const projectName = project.name;

  // Get reporter info
  const reporterDoc = await db.collection('users').doc(report.submittedBy).get();
  const reporterName = reporterDoc.exists ? reporterDoc.data().name : 'Người dùng';

  // Get users to notify
  const userIds = await getUsersToNotify(report.projectId);

  // Remove the reporter from notification list
 const usersToNotify = userIds.filter(id => id !== report.submittedBy);

  console.log(`Notifying ${usersToNotify.length} users`);

  // Create notifications
  const batch = db.batch();

  usersToNotify.forEach(userId => {
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    batch.set(notifRef, {
      type: 'report_created',
      title: 'Báo cáo mới',
      message: `${reporterName} đã tạo báo cáo cho dự án "${projectName}" - Ngày ${report.date}`,
      projectId: report.projectId,
      projectName: projectName,
      reportId: reportId,
      reportDate: report.date,
      createdBy: report.submittedBy,
      createdByName: reporterName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionUrl: `/projects/${report.projectId}/reports/${reportId}`
    });
  });

  await batch.commit();

  console.log(`Created ${usersToNotify.length} notifications for new report`);
  return null;
});

// Trigger when a report is updated
exports.onReportUpdated = onDocumentUpdated('reports/{reportId}', async (event) => {
 const before = event.data.before.data();
  const after = event.data.after.data();
  const reportId = event.params.reportId;

  // Check if substantive changes were made
  const hasSubstantiveChange =
    before.tasks !== after.tasks ||
    before.progressPercentage !== after.progressPercentage ||
    JSON.stringify(before.images) !== JSON.stringify(after.images);

  if (!hasSubstantiveChange) {
    console.log('No substantive changes, skipping notification');
    return null;
  }

  console.log(`Report updated: ${reportId} for project: ${after.projectId}`);

  // Get project info
  const projectDoc = await db.collection('projects').doc(after.projectId).get();
  if (!projectDoc.exists) {
    console.log('Project not found');
    return null;
  }

  const project = projectDoc.data();
  const projectName = project.name;

  // Get updater info
  const updaterDoc = await db.collection('users').doc(after.submittedBy).get();
  const updaterName = updaterDoc.exists ? updaterDoc.data().name : 'Người dùng';

  // Get users to notify
  const userIds = await getUsersToNotify(after.projectId);
  const usersToNotify = userIds.filter(id => id !== after.submittedBy);

  console.log(`Notifying ${usersToNotify.length} users about update`);

  // Create notifications
 const batch = db.batch();

  usersToNotify.forEach(userId => {
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    batch.set(notifRef, {
      type: 'report_updated',
      title: 'Báo cáo được cập nhật',
      message: `${updaterName} đã cập nhật báo cáo dự án "${projectName}" - Ngày ${after.date}`,
      projectId: after.projectId,
      projectName: projectName,
      reportId: reportId,
      reportDate: after.date,
      createdBy: after.submittedBy,
      createdByName: updaterName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionUrl: `/projects/${after.projectId}/reports/${reportId}`
    });
  });

  await batch.commit();

  console.log(`Created ${usersToNotify.length} notifications for updated report`);
  return null;
});

// Trigger when a review/comment is added
exports.onReviewAdded = onDocumentUpdated('projects/{projectId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const projectId = event.params.projectId;

  // Check if reviews were added
  const beforeReviews = before.reviews || {};
  const afterReviews = after.reviews || {};

 // Find new reviews
  let newReviews = [];
  for (const reportId in afterReviews) {
    const beforeArray = beforeReviews[reportId] || [];
    const afterArray = afterReviews[reportId] || [];

    if (afterArray.length > beforeArray.length) {
      const newReview = afterArray[afterArray.length - 1];
      newReviews.push({ reportId, review: newReview });
    }
  }

 if (newReviews.length === 0) {
    return null;
  }

  console.log(`Found ${newReviews.length} new reviews for project ${projectId}`);

  const projectName = after.name;

  // Process each new review
  for (const { reportId, review } of newReviews) {
    // Get report info
    const reportDoc = await db.collection('reports').doc(reportId).get();
    if (!reportDoc.exists) {
      console.log(`Report ${reportId} not found`);
      continue;
    }

    const report = reportDoc.data();

    // Get users to notify
    const userIds = await getUsersToNotify(projectId);
    const usersToNotify = userIds.filter(id => id !== review.reviewedById);

    console.log(`Notifying ${usersToNotify.length} users about new comment`);

    // Create notifications
    const batch = db.batch();

    usersToNotify.forEach(userId => {
      const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
      batch.set(notifRef, {
        type: 'comment_added',
        title: 'Nhận xét mới',
        message: `${review.reviewedByName} đã nhận xét báo cáo dự án "${projectName}" - Ngày ${report.date}`,
        projectId: projectId,
        projectName: projectName,
        reportId: reportId,
        reportDate: report.date,
        createdBy: review.reviewedById,
        createdByName: review.reviewedByName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        actionUrl: `/projects/${projectId}/reports/${reportId}`
      });
    });

    await batch.commit();
    console.log(`Created ${usersToNotify.length} notifications for new comment`);
  }

  return null;
});

// Trigger when a document is uploaded
exports.onDocumentUploaded = onDocumentCreated('projects/{projectId}/files/{fileId}', async (event) => {
  const file = event.data.data();
  const projectId = event.params.projectId;
  const fileId = event.params.fileId;

  console.log(`New file uploaded: ${file.name} for project: ${projectId}`);

  // Get project info
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    console.log('Project not found');
    return null;
  }

  const project = projectDoc.data();
  const projectName = project.name;

 // Get uploader info
  const uploaderDoc = await db.collection('users').doc(file.uploadedBy).get();
  const uploaderName = uploaderDoc.exists ? uploaderDoc.data().name : 'Người dùng';

  // Get users to notify
 const userIds = await getUsersToNotify(projectId);
  const usersToNotify = userIds.filter(id => id !== file.uploadedBy);

  console.log(`Notifying ${usersToNotify.length} users about new document`);

  // Create notifications
  const batch = db.batch();

  usersToNotify.forEach(userId => {
    const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
    batch.set(notifRef, {
      type: 'document_uploaded',
      title: 'Tài liệu mới',
      message: `${uploaderName} đã tải lên tài liệu "${file.name}" cho dự án "${projectName}"`,
      projectId: projectId,
      projectName: projectName,
      createdBy: file.uploadedBy,
      createdByName: uploaderName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionUrl: `/projects/${projectId}/documents`
    });
  });

  await batch.commit();

  console.log(`Created ${usersToNotify.length} notifications for new document`);
  return null;
});
