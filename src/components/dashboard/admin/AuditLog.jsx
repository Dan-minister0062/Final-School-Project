// src/components/dashboard/admin/AuditLog.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { FaFilter, FaScroll, FaSync } from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useNotification } from "../../../hooks/useNotification";
import { fetchAuditLogs, fetchSections } from "../../../services/rbacService";
import { getTranslation } from "../../../utils/translations";

const STATUS_BADGE = {
  success: { bg: "success", key: "outcomeSuccess" },
  denied: { bg: "danger", key: "outcomeDenied" },
  failure: { bg: "warning", key: "outcomeFailure" },
};

const AuditLog = () => {
  const { notify } = useNotification();
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const sectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;
  const sectionLabel = (id) => {
    if (!id) return "—";
    const match = sections.find((s) => s.id === id);
    return match ? sectionName(match) : id;
  };

  const [logs, setLogs] = useState([]);
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    section_id: "",
    status: "",
  });

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = { page: targetPage, per_page: 50 };
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params[key] = value;
        });

        const data = await fetchAuditLogs(params);
        setLogs(data?.data ?? []);
        setMeta(data?.meta ?? null);
        setPage(targetPage);
      } catch (error) {
        notify(
          error.response?.data?.message || t("loadAuditLogFailed"),
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, notify, t],
  );

  useEffect(() => {
    fetchSections()
      .then((list) => setSections(Array.isArray(list) ? list : []))
      .catch(() => setSections([]));
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FaScroll className="me-2 text-primary" />
            {t("auditLog")}
          </h2>
          <p className="text-muted mb-0">{t("auditLogSubtitle")}</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page)} disabled={loading}>
          <FaSync className={loading ? "me-2 fa-spin" : "me-2"} />
          {t("refreshLabel")}
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-semibold">{t("actionLabel")}</Form.Label>
              <Form.Control
                placeholder={t("actionPlaceholder")}
                value={filters.action}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, action: e.target.value }))
                }
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">{t("entityType")}</Form.Label>
              <Form.Control
                placeholder={t("entityTypePlaceholder")}
                value={filters.entity_type}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, entity_type: e.target.value }))
                }
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">{t("sectionLabel")}</Form.Label>
              <Form.Select
                value={filters.section_id}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, section_id: e.target.value }))
                }
              >
                <option value="">{t("allSections")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sectionName(s)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">{t("statusLabel")}</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="">{t("allOutcomes")}</option>
                <option value="success">{t("outcomeSuccess")}</option>
                <option value="denied">{t("outcomeDenied")}</option>
                <option value="failure">{t("outcomeFailure")}</option>
              </Form.Select>
            </Col>
          </Row>
          <div className="mt-3">
            <Button variant="primary" onClick={() => load(1)}>
              <FaFilter className="me-2" />
              {t("applyFilters")}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="table-responsive">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>{t("whenLabel")}</th>
                <th>{t("actorLabel")}</th>
                <th>{t("actionLabel")}</th>
                <th>{t("target")}</th>
                <th>{t("sectionLabel")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("descriptionLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    {loading ? t("loading") : t("noAuditEntries")}
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-nowrap small">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString(language)
                      : "—"}
                  </td>
                  <td>
                    <div className="fw-semibold">
                      {log.actor_name || t("systemActor")}
                    </div>
                    <div className="text-muted small">{log.actor_role || "—"}</div>
                  </td>
                  <td className="small">{log.action}</td>
                  <td className="small">
                    {log.entity_type ? `${log.entity_type} #${log.entity_id ?? "?"}` : "—"}
                  </td>
                  <td className="small">{sectionLabel(log.section_id)}</td>
                  <td>
                    <Badge bg={STATUS_BADGE[log.status]?.bg || "secondary"}>
                      {STATUS_BADGE[log.status]
                        ? t(STATUS_BADGE[log.status].key)
                        : log.status}
                    </Badge>
                  </td>
                  <td className="small text-muted">{log.description || "—"}</td>
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

export default AuditLog;