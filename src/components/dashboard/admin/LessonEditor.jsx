// src/components/dashboard/admin/LessonEditor.jsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
} from "react-bootstrap";
import { FaSave, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../../hooks/useNotification";
import { useRbac } from "../../../context/RbacContext";
import { useLanguage } from "../../../context/LanguageContext";
import { fetchServerClasses } from "../../../services/classService";
import {
  createLesson,
  fetchLesson,
  fetchSections,
  updateLesson,
} from "../../../services/rbacService";
import { getTranslation } from "../../../utils/translations";

const BLOCK_TYPES = ["text", "heading", "image", "video", "quote", "list"];

// Option labels are user-facing, so they are keyed to translation entries.
// The underlying values stay English because they are persisted in the DB.
const BLOCK_TYPE_LABEL_KEY = {
  text: "blockText",
  heading: "blockHeading",
  image: "blockImage",
  video: "blockVideo",
  quote: "blockQuote",
  list: "blockList",
};

const emptyBlock = () => ({
  key: Math.random().toString(36).slice(2),
  type: "text",
  title: "",
  body: "",
});

const emptyForm = () => ({
  title: "",
  description: "",
  objectives: "",
  section_id: "",
  class_id: "",
  due_date: "",
  estimated_minutes: "",
  status: "draft",
});

const LessonEditor = () => {
  const { lessonId } = useParams();
  const isEdit = !!lessonId;
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { isSubAdmin, sectionName, hasPermission } = useRbac();
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const localSectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;

  const [form, setForm] = useState(emptyForm());
  const [blocks, setBlocks] = useState([emptyBlock()]);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setSections(arr);
        // A Sub-Admin is pinned to one section, so preselect it and hide the picker.
        if (!isEdit && arr.length === 1) {
          setForm((p) => ({ ...p, section_id: String(arr[0].id) }));
        }
      })
      .catch(() => setSections([]));
  }, [isEdit]);

  useEffect(() => {
    fetchServerClasses().then((rows) => {
      setClasses(
        (rows ?? []).map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          section_id: row.section_id ?? null,
          level_key: row.level_key ?? row.level ?? null,
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchLesson(lessonId)
      .then((lesson) => {
        setForm({
          title: lesson.title ?? "",
          description: lesson.description ?? "",
          objectives: lesson.objectives ?? "",
          section_id: lesson.section_id ? String(lesson.section_id) : "",
          class_id: lesson.class_id ? String(lesson.class_id) : "",
          due_date: lesson.due_date ? String(lesson.due_date).slice(0, 10) : "",
          estimated_minutes: lesson.estimated_minutes ?? "",
          status: lesson.status ?? "draft",
        });

        const existing = Array.isArray(lesson.content_blocks)
          ? lesson.content_blocks
          : [];
        setBlocks(
          existing.length > 0
            ? existing.map((b) => ({
                key: `b${b.id ?? Math.random().toString(36).slice(2)}`,
                type: b.type ?? "text",
                title: b.title ?? "",
                body: typeof b.data === "object" ? b.data.body ?? "" : b.data ?? "",
              }))
            : [emptyBlock()],
        );
      })
      .catch((error) =>
        notify(
          error.response?.data?.message || t("loadLessonFailed"),
          "error",
        ),
      )
      .finally(() => setLoading(false));
  }, [isEdit, lessonId, notify, t]);

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const updateBlock = (key, field, value) =>
    setBlocks((prev) =>
      prev.map((b) => (b.key === key ? { ...b, [field]: value } : b)),
    );

  const addBlock = () => setBlocks((prev) => [...prev, emptyBlock()]);

  const removeBlock = (key) =>
    setBlocks((prev) =>
      prev.length === 1 ? prev : prev.filter((b) => b.key !== key),
    );

  const visibleClasses = form.section_id
    ? classes.filter(
        (c) => !c.section_id || String(c.section_id) === String(form.section_id),
      )
    : classes;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      title: form.title,
      description: form.description || null,
      objectives: form.objectives || null,
      class_id: form.class_id ? Number(form.class_id) : null,
      due_date: form.due_date || null,
      estimated_minutes: form.estimated_minutes
        ? Number(form.estimated_minutes)
        : null,
      status: form.status,
      content_blocks: blocks
        .filter((b) => b.title.trim() || b.body.trim())
        .map((b, index) => ({
          type: b.type,
          order: index,
          title: b.title || null,
          data: { body: b.body },
        })),
    };

    try {
      if (isEdit) {
        await updateLesson(lessonId, payload);
        notify(t("lessonUpdated"), "success");
      } else {
        await createLesson({ ...payload, section_id: Number(form.section_id) });
        notify(t("lessonCreated"), "success");
      }
      navigate("/dashboard/admin/lessons");
    } catch (error) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      notify(
        error.response?.data?.message || t("saveLessonFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            {isEdit ? t("editLesson") : t("newLesson")}
          </h2>
          <p className="text-muted mb-0">
            {isSubAdmin && sectionName
              ? t("filedUnder").replace("{section}", sectionName)
              : t("contentScopedToOneSection")}
          </p>
        </div>
      </div>

      {errors.title && (
        <Alert variant="danger">{errors.title[0]}</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="shadow-sm border-0 mb-3">
          <Card.Header className="bg-transparent fw-bold">
            {t("lessonDetails")}
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("lessonTitle")}</Form.Label>
                  <Form.Control
                    value={form.title}
                    onChange={set("title")}
                    isInvalid={!!errors.title}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("sectionLabel")}</Form.Label>
                  {isSubAdmin ? (
                    <Form.Control
                      value={sectionName || "—"}
                      readOnly
                      disabled
                    />
                  ) : (
                    <Form.Select
                      value={form.section_id}
                      onChange={set("section_id")}
                      isInvalid={!!errors.section_id}
                      required
                    >
                      <option value="">{t("selectASection")}</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {localSectionName(s)}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("classOptional")}</Form.Label>
                  <Form.Select
                    value={form.class_id}
                    onChange={set("class_id")}
                    disabled={isSubAdmin}
                  >
                    <option value="">{t("allClassesInSection")}</option>
                    {visibleClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
<Form.Label>{t("statusLabel")}</Form.Label>
                    <Form.Select
                      value={form.status}
                      onChange={set("status")}
                      disabled={form.status === "published" && !hasPermission("lessons.publish")}
                    >
                      <option value="draft">{t("draft")}</option>
                      {hasPermission("lessons.publish") && (
                        <option value="published">{t("published")}</option>
                      )}
                      <option value="archived">{t("archived")}</option>
                    </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("dueDate")}</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.due_date}
                    onChange={set("due_date")}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("estimatedMinutes")}</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={1000}
                    value={form.estimated_minutes}
                    onChange={set("estimated_minutes")}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("descriptionLabel")}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.description}
                    onChange={set("description")}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("objectives")}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.objectives}
                    onChange={set("objectives")}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mb-3">
          <Card.Header className="bg-transparent fw-bold d-flex justify-content-between align-items-center">
            <span>{t("contentBlocks")}</span>
            <Button size="sm" variant="outline-primary" onClick={addBlock}>
              {t("addBlock")}
            </Button>
          </Card.Header>
          <Card.Body>
            {blocks.map((block) => (
              <div key={block.key} className="border rounded p-3 mb-3">
                <Row className="g-2 mb-2">
                  <Col md={4}>
                    <Form.Select
                      value={block.type}
                      onChange={(e) =>
                        updateBlock(block.key, "type", e.target.value)
                      }
                    >
                      {BLOCK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(BLOCK_TYPE_LABEL_KEY[type])}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={7}>
                    <Form.Control
                      placeholder={t("blockTitle")}
                      value={block.title}
                      onChange={(e) =>
                        updateBlock(block.key, "title", e.target.value)
                      }
                    />
                  </Col>
                  <Col md={1} className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeBlock(block.key)}
                      disabled={blocks.length === 1}
                    >
                      <FaTrash />
                    </Button>
                  </Col>
                </Row>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={t("blockBody")}
                  value={block.body}
                  onChange={(e) =>
                    updateBlock(block.key, "body", e.target.value)
                  }
                />
              </div>
            ))}
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            <FaSave className="me-2" />
            {saving
              ? t("saving")
              : isEdit
                ? t("saveChanges")
                : t("createLesson")}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => navigate("/dashboard/admin/lessons")}
          >
            {t("cancel")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default LessonEditor;