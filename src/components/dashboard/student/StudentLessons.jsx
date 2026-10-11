// src/components/dashboard/student/StudentLessons.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Collapse,
  Form,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import {
  FaBookOpen,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaLink,
  FaPaperclip,
  FaSync,
} from "react-icons/fa";
import { useNotification } from "../../../hooks/useNotification";
import { useLanguage } from "../../../context/LanguageContext";
import {
  fetchLessons,
  submitLessonAssignment,
  trackLessonProgress,
} from "../../../services/rbacService";
import { getTranslation } from "../../../utils/translations";

const STATUS_COMPLETED = "completed";

// The endpoint returns a plain array for students but a paginated envelope for
// admin listings, so accept both shapes.
const normalise = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const StudentLessons = () => {
  const { notify } = useNotification();
  const { language, isArabic } = useLanguage();
  // Stable identity: it is a dependency of the load callback below, which the
  // mount effect depends on, so a new function each render would refetch in a loop.
  const t = useCallback((key) => getTranslation(key, language), [language]);
  const localSectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;
  const formatBytes = (bytes) => {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return "";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLessons(normalise(await fetchLessons()));
    } catch (error) {
      notify(
        error.response?.data?.message || t("loadLessonsFailed"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return lessons;
    return lessons.filter(
      (lesson) =>
        (lesson.title || "").toLowerCase().includes(term) ||
        (lesson.description || "").toLowerCase().includes(term),
    );
  }, [lessons, search]);

  const progressFor = (lesson) => {
    const rows = Array.isArray(lesson.progressRecords) ? lesson.progressRecords : [];
    if (rows.length === 0) return { percent: 0, completed: false };
    const row = rows[0];
    const percent = Number(row.progress_percent ?? 0);
    return {
      percent,
      completed: row.status === STATUS_COMPLETED || percent >= 100,
    };
  };

  const progressLabel = (lesson) => {
    const { percent, completed } = progressFor(lesson);
    if (completed) return t("lessonCompleted");
    if (percent > 0) return `${t("inProgress")} (${percent}%)`;
    return t("lessonNotStarted");
  };

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const markComplete = async (lesson) => {
    setBusy(true);
    try {
      await trackLessonProgress(lesson.id, {
        status: STATUS_COMPLETED,
        progress_percent: 100,
      });
      notify(t("lessonCompleted"), "success");
      load();
    } catch (error) {
      notify(error.response?.data?.message || t("actionFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const sendSubmission = async (assignment) => {
    const key = assignment.id;
    const body = (drafts[key] ?? "").trim();
    if (!body) {
      notify(t("submitAnswerRequired"), "error");
      return;
    }
    setBusy(true);
    try {
      await submitLessonAssignment(key, { content: body, submit: true });
      setDrafts((prev) => ({ ...prev, [key]: "" }));
      notify(t("assignmentSubmitted"), "success");
      load();
    } catch (error) {
      notify(error.response?.data?.message || t("actionFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FaBookOpen className="me-2 text-primary" />
            {t("myLessons")}
          </h2>
          <p className="text-muted mb-0">{t("myLessonsSubtitle")}</p>
        </div>
        <Button variant="outline-secondary" onClick={load} disabled={loading}>
          <FaSync className={loading ? "me-2 fa-spin" : "me-2"} />
          {t("refreshLabel")}
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>{t("lessonTitle")}</InputGroup.Text>
            <Form.Control
              placeholder={t("searchLessons")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {visible.length === 0 && (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center text-muted py-5">
            {loading ? t("loading") : t("noLessonsFound")}
          </Card.Body>
        </Card>
      )}

      <div className="d-flex flex-column gap-3">
        {visible.map((lesson) => {
          const open = !!expanded[lesson.id];
          const { percent, completed } = progressFor(lesson);
          const assignments = Array.isArray(lesson.assignments)
            ? lesson.assignments
            : [];

          return (
            <Card key={lesson.id} className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <h5 className="fw-semibold mb-1">{lesson.title}</h5>
                    {lesson.description && (
                      <p className="text-muted small mb-2">
                        {lesson.description}
                      </p>
                    )}
                    <div className="d-flex flex-wrap gap-2 small">
                      {lesson.section && (
                        <Badge bg="info" text="dark">
                          {localSectionName(lesson.section)}
                        </Badge>
                      )}
                      <Badge bg="light" text="dark">
                        {t("classLabel")}: {lesson.school_class?.code ?? "—"}
                      </Badge>
                      {lesson.author?.name && (
                        <Badge bg="light" text="dark">
                          {t("authorLabel")}: {lesson.author.name}
                        </Badge>
                      )}
                      {lesson.estimated_minutes ? (
                        <Badge bg="light" text="dark">
                          <FaClock className="me-1" />
                          {lesson.estimated_minutes} {t("estimatedMinutes")}
                        </Badge>
                      ) : null}
                      {lesson.due_date && (
                        <Badge bg="warning" text="dark">
                          {t("dueDate")}:{" "}
                          {new Date(lesson.due_date).toLocaleDateString(language)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-end">
                    <Badge
                      bg={completed ? "success" : percent > 0 ? "info" : "secondary"}
                      className="mb-2"
                    >
                      {progressLabel(lesson)}
                    </Badge>
                    <div>
                      {!completed && (
                        <Button
                          size="sm"
                          variant="outline-success"
                          className="me-2"
                          disabled={busy}
                          onClick={() => markComplete(lesson)}
                        >
                          <FaCheckCircle className="me-1" />
                          {t("markLessonComplete")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => toggle(lesson.id)}
                      >
                        {t("lessonDetails")}
                        {open ? (
                          <FaChevronUp className="ms-2" />
                        ) : (
                          <FaChevronDown className="ms-2" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <ProgressBar
                  now={percent}
                  label={`${percent}%`}
                  variant={completed ? "success" : "primary"}
                  className="mt-3"
                  animated={!completed && percent > 0}
                />

                <Collapse in={open}>
                  <div>
                    <hr />

                    {lesson.objectives && (
                      <div className="mb-3">
                        <h6 className="fw-semibold">{t("objectives")}</h6>
                        <p className="text-muted small mb-0">
                          {lesson.objectives}
                        </p>
                      </div>
                    )}

                    <h6 className="fw-semibold">
                      <FaPaperclip className="me-2 text-primary" />
                      {t("lessonAttachments")}
                    </h6>
                    {Array.isArray(lesson.attachments) &&
                    lesson.attachments.length === 0 ? (
                      <p className="text-muted small mb-0">{t("noAttachments")}</p>
                    ) : (
                      <ul className="list-unstyled mb-3">
                        {(lesson.attachments || []).map((attachment, index) => {
                          const href =
                            attachment.external_url || attachment.file_url;
                          const label =
                            attachment.title ||
                            attachment.file_name ||
                            href ||
                            "";
                          return (
                            <li
                              key={attachment.id ?? `${href}-${index}`}
                              className="d-flex align-items-center gap-2 border rounded px-3 py-2 mb-2"
                            >
                              <span className="text-primary">
                                {attachment.external_url ? (
                                  <FaLink />
                                ) : (
                                  <FaPaperclip />
                                )}
                              </span>
                              <span className="flex-grow-1 text-truncate small">
                                {label}
                              </span>
                              {attachment.file_size ? (
                                <span className="text-muted small text-nowrap">
                                  {formatBytes(attachment.file_size)}
                                </span>
                              ) : null}
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-secondary text-nowrap"
                              >
                                {t("attachmentOpen")}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <h6 className="fw-semibold">{t("lessonAssignments")}</h6>
                    {assignments.length === 0 ? (
                      <p className="text-muted small mb-0">
                        {t("noLessonsFound")}
                      </p>
                    ) : (
                      assignments.map((assignment) => (
                        <Card
                          key={assignment.id}
                          className="mb-2 bg-light border-0"
                        >
                          <Card.Body>
                            <div className="fw-semibold small">
                              {assignment.title}
                            </div>
                            {assignment.instructions && (
                              <div className="text-muted small mt-1">
                                <strong>{t("assignmentInstructions")}:</strong>{" "}
                                {assignment.instructions}
                              </div>
                            )}
                            <div className="text-muted small mt-1">
                              {assignment.max_score != null && (
                                <span className="me-3">
                                  {t("maxScoreLabel")}: {assignment.max_score}
                                </span>
                              )}
                              {assignment.due_date && (
                                <span>
                                  {t("dueDate")}:{" "}
                                  {new Date(
                                    assignment.due_date,
                                  ).toLocaleDateString(language)}
                                </span>
                              )}
                            </div>

                            <Form.Group className="mt-2">
                              <Form.Label className="small mb-1">
                                {t("yourAnswer")}
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={drafts[assignment.id] ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [assignment.id]: e.target.value,
                                  }))
                                }
                              />
                            </Form.Group>
                            <div className="text-end mt-2">
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={busy}
                                onClick={() => sendSubmission(assignment)}
                              >
                                {t("submitAssignment")}
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </div>
                </Collapse>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudentLessons;
