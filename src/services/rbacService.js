import api from "./api";

// Thin wrapper around the server-side RBAC endpoints. The server stays
// authoritative; these helpers only shape the payload for the UI.

export const fetchMyRbac = async () => {
  const { data } = await api.get("/rbac/me");
  return data;
};

export const fetchSections = async () => {
  const { data } = await api.get("/rbac/sections");
  return data?.sections ?? data ?? [];
};

export const fetchPermissionCatalogue = async () => {
  const { data } = await api.get("/rbac/permissions");
  return data;
};

export const fetchAdmins = async () => {
  const { data } = await api.get("/admins");
  return data?.admins ?? data ?? [];
};

export const fetchAuditLogs = async (params = {}) => {
  const { data } = await api.get("/audit-logs", { params });
  return data;
};

export const createAdmin = async (payload) => {
  const { data } = await api.post("/admins", payload);
  return data;
};

export const updateAdmin = async (id, payload) => {
  const { data } = await api.put(`/admins/${id}`, payload);
  return data;
};

export const deleteAdmin = async (id) => {
  const { data } = await api.delete(`/admins/${id}`);
  return data;
};

export const setAdminPermissions = async (id, permissions) => {
  const { data } = await api.patch(`/admins/${id}/permissions`, {
    permissions,
  });
  return data;
};

export const setAdminStatus = async (id, status) => {
  const { data } = await api.patch(`/admins/${id}/status`, { status });
  return data;
};

export const promoteAdmin = async (id) => {
  const { data } = await api.patch(`/admins/${id}/promote`);
  return data;
};

export const demoteAdmin = async (id) => {
  const { data } = await api.patch(`/admins/${id}/demote`);
  return data;
};

// ===== Lessons =====
export const fetchLessons = async (params = {}) => {
  const { data } = await api.get("/lessons", { params });
  return data;
};

export const fetchLesson = async (lessonId) => {
  const { data } = await api.get(`/lessons/${lessonId}`);
  return data;
};

export const createLesson = async (payload) => {
  const { data } = await api.post("/lessons", payload);
  return data;
};

export const updateLesson = async (lessonId, payload) => {
  const { data } = await api.put(`/lessons/${lessonId}`, payload);
  return data;
};

export const deleteLesson = async (lessonId) => {
  const { data } = await api.delete(`/lessons/${lessonId}`);
  return data;
};

export const publishLesson = async (lessonId) => {
  const { data } = await api.post(`/lessons/${lessonId}/publish`);
  return data;
};

export const archiveLesson = async (lessonId) => {
  const { data } = await api.post(`/lessons/${lessonId}/archive`);
  return data;
};

export const duplicateLesson = async (lessonId) => {
  const { data } = await api.post(`/lessons/${lessonId}/duplicate`);
  return data;
};

export const fetchLessonAnalytics = async (lessonId) => {
  const { data } = await api.get(`/lessons/${lessonId}/analytics`);
  return data;
};

/**
 * Upload one lesson attachment. The shared axios instance sets a JSON
 * Content-Type, which would make axios serialise the FormData as JSON and
 * lose the binary, so the header is cleared to let the browser set the
 * multipart boundary itself.
 */
export const uploadLessonAttachment = async (file, title = "") => {
  const body = new FormData();
  body.append("file", file);
  if (title) body.append("title", title);

  const { data } = await api.post("/lesson-attachments", body, {
    headers: { "Content-Type": undefined },
    timeout: 0,
  });
  return data;
};

/** Register an externally hosted attachment (a YouTube/Vimeo link, a Drive file). */
export const registerLessonAttachmentLink = async (url, title = "") => {
  const { data } = await api.post("/lesson-attachments", {
    external_url: url,
    title: title || undefined,
  });
  return data;
};

export const fetchLessonSubmissions = async (lessonId, params = {}) => {
  const { data } = await api.get(`/lessons/${lessonId}/submissions`, { params });
  return data;
};

export const gradeSubmission = async (submissionId, payload) => {
  const { data } = await api.put(`/lesson-submissions/${submissionId}/grade`, payload);
  return data;
};

export const fetchMySubmissions = async () => {
  const { data } = await api.get("/lesson-submissions/mine");
  return data;
};

export const submitLessonAssignment = async (assignmentId, payload) => {
  const { data } = await api.post(`/lesson-assignments/${assignmentId}/submit`, payload);
  return data;
};

export const trackLessonProgress = async (lessonId, payload) => {
  const { data } = await api.post(`/lessons/${lessonId}/progress`, payload);
  return data;
};

export default {
  fetchMyRbac,
  fetchSections,
  fetchPermissionCatalogue,
  fetchAdmins,
  fetchAuditLogs,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  setAdminPermissions,
  setAdminStatus,
  promoteAdmin,
  demoteAdmin,
  fetchLessons,
  fetchLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  archiveLesson,
  duplicateLesson,
  fetchLessonAnalytics,
  fetchLessonSubmissions,
  gradeSubmission,
  fetchMySubmissions,
  submitLessonAssignment,
  trackLessonProgress,
};