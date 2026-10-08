// src/components/dashboard/admin/LessonEditor.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  FaSave,
  FaTrash,
  FaPaperclip,
  FaLink,
  FaFileAlt,
  FaFilePdf,
  FaFileAudio,
  FaFileVideo,
  FaFileImage,
  FaFileWord,
  FaFileArchive,
  FaFileCsv,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../../hooks/useNotification";
import { useRbac } from "../../../context/RbacContext";
import { useLanguage } from "../../../context/LanguageContext";
import { fetchServerClasses } from "../../../services/classService";
import {
  createLesson,
  fetchLesson,
  fetchSections,
  registerLessonAttachmentLink,
  updateLesson,
  uploadLessonAttachment,
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

// Matches the extension allowlist enforced by LessonController::storeAttachment.
const ATTACHMENT_ACCEPT = [
  "image/*",
  "video/*",
  "audio/*",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".rtf",
  ".txt",
  ".md",
  ".csv",
  ".epub",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
].join(",");

// Human labels for the attachment list, kept next to the feature they serve.
const ATTACHMENT_COPY = {
  en: {
    heading: "Attachments",
    hint: "Add files or videos for this lesson. Students see them with the lesson.",
    choose: "Choose files",
    uploading: "Uploading…",
    linkLabel: "Or add a link",
    linkPlaceholder: "https://… (YouTube, Vimeo, Google Drive…)",
    linkTitle: "Link title (optional)",
    addLink: "Add link",
    empty: "No attachments yet.",
    remove: "Remove attachment",
    uploadFailed: "Attachment upload failed",
    linkFailed: "Could not add that link",
    tooLarge: "That file is larger than the 100 MB limit",
    badType: "That file type is not allowed",
  },
  ar: {
    heading: "المرفقات",
    hint: "أضف ملفات أو مقاطع فيديو لهذا الدرس. سيراها التلاميذ مع الدرس.",
    choose: "اختر الملفات",
    uploading: "جارٍ الرفع…",
    linkLabel: "أو أضف رابطًا",
    linkPlaceholder: "https://… (يوتيوب، فيميو، جوجل درايف…)",
    linkTitle: "عنوان الرابط (اختياري)",
    addLink: "أضف الرابط",
    empty: "لا توجد مرفقات بعد.",
    remove: "حذف المرفق",
    uploadFailed: "فشل رفع المرفق",
    linkFailed: "تعذّرت إضافة الرابط",
    tooLarge: "حجم الملف أكبر من الحد المسموح (100 ميجابايت)",
    badType: "نوع الملف غير مسموح",
  },
};

// Picks a glyph for an attachment based on its mime type or file extension.
const attachmentIcon = (attachment) => {
  const type = (attachment.file_type || "").toLowerCase();
  const name = (attachment.file_name || attachment.title || "").toLowerCase();
  if (type.startsWith("image/")) return <FaFileImage />;
  if (type.startsWith("video/")) return <FaFileVideo />;
  if (type.startsWith("audio/")) return <FaFileAudio />;
  if (name.endsWith(".pdf")) return <FaFilePdf />;
  if (/\.(doc|docx|odt|rtf)$/.test(name)) return <FaFileWord />;
  if (/\.(csv|xls|xlsx|ods)$/.test(name)) return <FaFileCsv />;
  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return <FaFileArchive />;
  return <FaFileAlt />;
};

const formatBytes = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const LessonEditor = () => {
  const { lessonId } = useParams();
  const isEdit = !!lessonId;
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { isSubAdmin, sectionName, hasPermission, role } = useRbac();
  const { language, isArabic } = useLanguage();

  // Teachers author through the same editor; they are authorised by route
  // middleware, so they do not need RBAC grants for publishing.
  const isTeacher = role === "teacher";
  const basePath = isTeacher
    ? "/dashboard/teacher/lessons"
    : "/dashboard/admin/lessons";
  const canPublish = isTeacher || hasPermission("lessons.publish");
  // Must be referentially stable: it is an effect dependency, and a new
  // function identity on every render made the lesson loader re-run forever.
  const t = useCallback((key) => getTranslation(key, language), [language]);
  const localSectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;
  const localClassName = (row) =>
    isArabic ? row?.name_ar || row?.name : row?.name_en || row?.name;

  const [form, setForm] = useState(emptyForm());
  const [blocks, setBlocks] = useState([emptyBlock()]);
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Attachments are uploaded straight away so the browser holds a real URL;
  // that list is then sent with the lesson so the rows are persisted on save.
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const fileInputRef = useRef(null);
  const copy = ATTACHMENT_COPY[isArabic ? "ar" : "en"];
  // The allowlist mirrors the controller's extension check, so an
  // executable can never be sent to the API in the first place.
  const MAX_BYTES = 100 * 1024 * 1024;

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
          // The API exposes id/code as the class code; lessons attach by the
          // integer classes.id, so prefer db_id when present.
          id: row.db_id ?? row.id,
          code: row.code,
          name: row.name,
          name_en: row.name_en ?? row.nameEn ?? row.name,
          name_ar: row.name_ar ?? row.nameAr ?? row.name,
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

        const saved = Array.isArray(lesson.attachments) ? lesson.attachments : [];
        setAttachments(
          saved.map((a) => ({
            id: a.id,
            file_url: a.file_url,
            external_url: a.external_url,
            file_name: a.file_name,
            file_type: a.file_type,
            file_size: a.file_size,
            title: a.title,
          })),
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

  // ===== ATTACHMENTS =====

  const handleFilesSelected = async (event) => {
    const picked = Array.from(event.target.files || []);
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = "";
    if (picked.length === 0) return;

    setUploading(true);
    try {
      for (const file of picked) {
        if (file.size > MAX_BYTES) {
          notify(`${file.name}: ${copy.tooLarge}`, "error");
          continue;
        }
        try {
          const uploaded = await uploadLessonAttachment(file);
          setAttachments((prev) => [...prev, uploaded]);
        } catch (error) {
          const status = error.response?.status;
          notify(
            status === 422
              ? `${file.name}: ${copy.badType}`
              : `${copy.uploadFailed}: ${error.response?.data?.message || file.name}`,
            "error",
          );
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setUploading(true);
    try {
      const registered = await registerLessonAttachmentLink(url, linkTitle.trim());
      setAttachments((prev) => [...prev, registered]);
      setLinkUrl("");
      setLinkTitle("");
    } catch (error) {
      notify(
        error.response?.data?.message || copy.linkFailed,
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (attachment) =>
    setAttachments((prev) => prev.filter((a) => a !== attachment));

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
      // The controller replaces the lesson's attachment set with whatever is
      // in this array, so removed rows disappear and kept ones are matched by
      // file_url rather than duplicated.
      attachments: attachments.map((a) => ({
        file_url: a.file_url,
        external_url: a.external_url ?? null,
        file_name: a.file_name ?? null,
        file_type: a.file_type ?? null,
        file_size: a.file_size ?? null,
        title: a.title ?? null,
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
      navigate(basePath);
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
                  >
                    <option value="">{t("allClassesInSection")}</option>
                    {visibleClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {localClassName(c)} ({c.code})
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
                      disabled={form.status === "published" && !canPublish}
                    >
                      <option value="draft">{t("draft")}</option>
                      {canPublish && (
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

        <Card className="shadow-sm border-0 mb-3">
          <Card.Header className="bg-transparent fw-bold d-flex justify-content-between align-items-center">
            <span className="d-inline-flex align-items-center gap-2">
              <FaPaperclip /> {copy.heading}
            </span>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  {copy.uploading}
                </>
              ) : (
                copy.choose
              )}
            </Button>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">{copy.hint}</p>

            <Form.Control
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFilesSelected}
              className="d-none"
              aria-hidden="true"
              tabIndex={-1}
            />

            {attachments.length === 0 ? (
              <p className="text-muted mb-0">{copy.empty}</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {attachments.map((attachment, index) => (
                  <li
                    key={attachment.id ?? `${attachment.file_url}-${index}`}
                    className="d-flex align-items-center gap-2 border rounded px-3 py-2 mb-2"
                  >
                    <span className="text-primary">
                      {attachment.external_url ? <FaLink /> : attachmentIcon(attachment)}
                    </span>
                    <span className="flex-grow-1 text-truncate">
                      {attachment.title || attachment.file_name || attachment.file_url}
                    </span>
                    {attachment.file_size ? (
                      <span className="text-muted small text-nowrap">
                        {formatBytes(attachment.file_size)}
                      </span>
                    ) : null}
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-secondary text-nowrap"
                    >
                      {isArabic ? "فتح" : "Open"}
                    </a>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeAttachment(attachment)}
                      title={copy.remove}
                      aria-label={copy.remove}
                    >
                      <FaTrash />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <hr className="my-3" />

            <Row className="g-2 align-items-end">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="small mb-1">{copy.linkLabel}</Form.Label>
                  <Form.Control
                    type="url"
                    value={linkUrl}
                    placeholder={copy.linkPlaceholder}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small mb-1">{copy.linkTitle}</Form.Label>
                  <Form.Control
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={handleAddLink}
                  disabled={uploading || !linkUrl.trim()}
                >
                  {copy.addLink}
                </Button>
              </Col>
            </Row>
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
            onClick={() => navigate(basePath)}
          >
            {t("cancel")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default LessonEditor;