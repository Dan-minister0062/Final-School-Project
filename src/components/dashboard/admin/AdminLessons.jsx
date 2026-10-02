// src/components/dashboard/admin/AdminLessons.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Row,
  Table,
} from "react-bootstrap";
import {
  FaBook,
  FaCopy,
  FaEye,
  FaPlus,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../hooks/useNotification";
import { useRbac } from "../../../context/RbacContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  archiveLesson,
  deleteLesson,
  duplicateLesson,
  fetchLessons,
  publishLesson,
} from "../../../services/rbacService";
import { getTranslation } from "../../../utils/translations";

const STATUS_BADGE = {
  draft: { bg: "secondary", key: "draft" },
  published: { bg: "success", key: "published" },
  archived: { bg: "dark", key: "archived" },
};

// The admin listing endpoint paginates; student/parent listings do not.
const normalise = (payload) => {
  if (Array.isArray(payload)) return { rows: payload, meta: null };
  return { rows: payload?.data ?? [], meta: payload?.meta ?? null };
};

const AdminLessons = () => {
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { hasPermission, isSubAdmin, sectionName } = useRbac();
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const localSectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;

  const [lessons, setLessons] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = { page: targetPage, per_page: 25 };
        if (statusFilter) params.status = statusFilter;

        const { rows, meta: pageMeta } = normalise(await fetchLessons(params));
        setLessons(rows);
        setMeta(pageMeta);
        setPage(targetPage);
      } catch (error) {
        notify(
          error.response?.data?.message || t("loadLessonsFailed"),
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, notify, t],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const runAction = async (label, action) => {
    try {
      await action();
      notify(t(label), "success");
      load(page);
    } catch (error) {
      notify(error.response?.data?.message || t("actionFailed"), "error");
    }
  };

  const visible = lessons.filter((lesson) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      (lesson.title || "").toLowerCase().includes(term) ||
      (lesson.description || "").toLowerCase().includes(term)
    );
  });

  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FaBook className="me-2 text-primary" />
            {t("lessonsManagement")}
          </h2>
          <p className="text-muted mb-0">
            {isSubAdmin && sectionName
              ? t("scopedToSection").replace("{section}", sectionName)
              : t("allSectionsScope")}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => load(page)}
            disabled={loading}
          >
            <FaSync className={loading ? "me-2 fa-spin" : "me-2"} />
            {t("refreshLabel")}
          </Button>
          {hasPermission("lessons.create") && (
            <Button
              variant="primary"
              onClick={() => navigate("/dashboard/admin/lessons/new")}
            >
              <FaPlus className="me-2" />
              {t("newLesson")}
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>{t("lessonTitle")}</InputGroup.Text>
                <Form.Control
                  placeholder={t("searchLessons")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t("allStatuses")}</option>
                <option value="draft">{t("draft")}</option>
                <option value="published">{t("published")}</option>
                <option value="archived">{t("archived")}</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="table-responsive">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>{t("lessonTitle")}</th>
                <th>{t("sectionLabel")}</th>
                <th>{t("classLabel")}</th>
                <th>{t("authorLabel")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("dueLabel")}</th>
                <th className="text-end">{t("actionsLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    {loading ? t("loading") : t("noLessonsFound")}
                  </td>
                </tr>
              )}
              {visible.map((lesson) => (
                <tr key={lesson.id}>
                  <td>
                    <div className="fw-semibold">{lesson.title}</div>
                    {lesson.description && (
                      <div className="text-muted small">
                        {String(lesson.description).slice(0, 80)}
                      </div>
                    )}
                  </td>
                  <td>
                    {lesson.section ? (
                      <Badge bg="info" text="dark">
                        {localSectionName(lesson.section)}
                      </Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="small">
                    {lesson.school_class?.code ?? "—"}
                  </td>
                  <td className="small">{lesson.author?.name ?? "—"}</td>
                  <td>
                    <Badge bg={STATUS_BADGE[lesson.status]?.bg || "secondary"}>
                      {STATUS_BADGE[lesson.status]
                        ? t(STATUS_BADGE[lesson.status].key)
                        : lesson.status}
                    </Badge>
                  </td>
                  <td className="small text-nowrap">
                    {lesson.due_date
                      ? new Date(lesson.due_date).toLocaleDateString(language)
                      : "—"}
                  </td>
                  <td className="text-end text-nowrap">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="me-2"
                      onClick={() =>
                        navigate(`/dashboard/admin/lessons/${lesson.id}/edit`)
                      }
                    >
                      <FaEye />
                    </Button>

                    {hasPermission("lessons.update") && (
                      <Button
                        size="sm"
                        variant="outline-info"
                        className="me-2"
                        onClick={() =>
                          navigate(`/dashboard/admin/lessons/${lesson.id}/edit`)
                        }
                      >
{t("editLesson")}
                        </Button>
                    )}

                    {hasPermission("lessons.publish") &&
                      lesson.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline-success"
                          className="me-2"
                          onClick={() =>
                            runAction("lessonPublished", () =>
                              publishLesson(lesson.id),
                            )
                          }
                        >
                          {t("publishBtn")}
                        </Button>
                      )}

                    {hasPermission("lessons.archive") &&
                      lesson.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="me-2"
                          onClick={() =>
                            runAction("lessonArchived", () =>
                              archiveLesson(lesson.id),
                            )
                          }
                        >
                          {t("archiveBtn")}
                        </Button>
                      )}

                    {hasPermission("lessons.duplicate") && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() =>
                          runAction("lessonDuplicated", () =>
                            duplicateLesson(lesson.id),
                          )
                        }
                      >
                        <FaCopy />
                      </Button>
                    )}

                    {hasPermission("lessons.delete") && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() =>
                          runAction("lessonDeleted", () =>
                            deleteLesson(lesson.id),
                          )
                        }
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            {t("previous")}
          </Button>
          <span className="small text-muted">
            {t("pageOf").replace("{page}", page).replace("{total}", totalPages)}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminLessons;