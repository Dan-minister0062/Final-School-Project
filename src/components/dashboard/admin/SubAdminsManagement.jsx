// src/components/dashboard/admin/SubAdminsManagement.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import {
  FaKey,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrash,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useNotification } from "../../../hooks/useNotification";
import {
  createAdmin,
  deleteAdmin,
  demoteAdmin,
  fetchAdmins,
  fetchPermissionCatalogue,
  fetchSections,
  promoteAdmin,
  setAdminPermissions,
  setAdminStatus,
} from "../../../services/rbacService";
import { getTranslation } from "../../../utils/translations";

const TIER_BADGE = {
  super_admin: { bg: "danger", key: "superAdmin" },
  sub_admin: { bg: "primary", key: "subAdmin" },
};

const SubAdminsManagement = () => {
  const { notify } = useNotification();
  const { language, isArabic } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const sectionName = (section) =>
    isArabic ? section?.name_ar || section?.name : section?.name_en || section?.name;

  const [admins, setAdmins] = useState([]);
  const [sections, setSections] = useState([]);
  const [catalogue, setCatalogue] = useState({ permissions: {}, groups: {}, super_only: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    section_id: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminList, sectionList, cat] = await Promise.all([
        fetchAdmins(),
        fetchSections(),
        fetchPermissionCatalogue(),
      ]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setSections(Array.isArray(sectionList) ? sectionList : []);
      setCatalogue({
        permissions: cat?.permissions ?? {},
        groups: cat?.groups ?? {},
        super_only: Array.isArray(cat?.super_only) ? cat.super_only : [],
      });
    } catch (error) {
      notify(
        error.response?.data?.message || t("loadAdminsFailed"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term),
    );
  }, [admins, search]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      section_id: sections[0]?.id ? String(sections[0].id) : "",
    });
    setFormErrors({});
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormErrors({});
    try {
      await createAdmin({
        ...form,
        section_id: Number(form.section_id),
      });
      notify(t("subAdminCreated"), "success");
      setShowCreate(false);
      resetForm();
      load();
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) setFormErrors(errors);
      notify(
        error.response?.data?.message || t("createSubAdminFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const openPermissions = (admin) => {
    setEditing(admin);
    setDraftPermissions(
      Array.isArray(admin.permissions) ? [...admin.permissions] : [],
    );
    setShowPermissions(true);
  };

  const togglePermission = (key) => {
    setDraftPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const savePermissions = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await setAdminPermissions(editing.id, draftPermissions);
      notify(t("permissionsUpdated"), "success");
      setShowPermissions(false);
      load();
    } catch (error) {
      notify(
        error.response?.data?.message || t("actionFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (label, action) => {
    try {
      await action();
      notify(t(label), "success");
      load();
    } catch (error) {
      notify(error.response?.data?.message || t("actionFailed"), "error");
    }
  };

  const groupEntries = Object.entries(catalogue.groups || {});

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FaUserShield className="me-2 text-primary" />
            {t("subAdminsManagement")}
          </h2>
          <p className="text-muted mb-0">{t("subAdminsSubtitle")}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={load} disabled={loading}>
            <FaSync className={loading ? "me-2 fa-spin" : "me-2"} />
            {t("refreshLabel")}
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <FaPlus className="me-2" />
            {t("newSubAdmin")}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder={t("searchByNameOrEmail")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="table-responsive">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>{t("nameLabel")}</th>
                <th>{t("sectionLabel")}</th>
                <th>{t("adminTier")}</th>
                <th>{t("permissionScope")}</th>
                <th>{t("statusLabel")}</th>
                <th className="text-end">{t("actionsLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    {loading ? t("loading") : t("noAdminsFound")}
                  </td>
                </tr>
              )}
              {filtered.map((admin) => {
                const badge = TIER_BADGE[admin.tier] || TIER_BADGE.sub_admin;
                const count = Array.isArray(admin.permissions)
                  ? admin.permissions.length
                  : 0;
                return (
                  <tr key={admin.id}>
                    <td>
                      <div className="fw-semibold">{admin.name}</div>
                      <div className="text-muted small">{admin.email}</div>
                    </td>
                    <td>
                      {admin.section ? (
                        <Badge bg="info" text="dark">
                          {sectionName(admin.section)}
                        </Badge>
                      ) : (
                        <span className="text-muted">{t("allSections")}</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={badge.bg}>{t(badge.key)}</Badge>
                    </td>
                    <td>
                      {admin.is_super_admin ? (
                        <span className="text-muted">{t("allLabel")}</span>
                      ) : (
                        <span>{count}</span>
                      )}
                    </td>
                    <td>
                      <Badge bg={admin.status === "active" ? "success" : "secondary"}>
                        {admin.status === "suspended"
                          ? t("suspendedStatus")
                          : t("activeStatus")}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {admin.is_super_admin ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-2"
                            onClick={() =>
                              runAction("adminDemoted", () => demoteAdmin(admin.id))
                            }
                          >
                            <FaUsers className="me-1" />
                            {t("demote")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled
                            title={t("superAdminProtected")}
                          >
                            <FaTrash />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-2"
                            onClick={() => openPermissions(admin)}
                          >
                            <FaKey className="me-1" />
                            {t("managePermissions")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="me-2"
                            onClick={() =>
                              runAction(
                                admin.status === "active"
                                  ? "adminSuspended"
                                  : "adminReactivated",
                                () =>
                                  setAdminStatus(
                                    admin.id,
                                    admin.status === "active" ? "suspended" : "active",
                                  ),
                              )
                            }
                          >
                            {admin.status === "active" ? t("suspend") : t("reactivate")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="me-2"
                            onClick={() =>
                              runAction("adminPromoted", () => promoteAdmin(admin.id))
                            }
                          >
                            {t("promote")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              runAction("subAdminDeletedShort", () => deleteAdmin(admin.id))
                            }
                          >
                            <FaTrash />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* ===== CREATE ===== */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("newSubAdmin")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("nameLabel")}</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("emailLabel")}</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    isInvalid={!!formErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("phoneLabel")}</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("sectionLabel")}</Form.Label>
                  <Form.Select
                    value={form.section_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, section_id: e.target.value }))
                    }
                    isInvalid={!!formErrors.section_id}
                  >
                    <option value="">{t("selectASection")}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {sectionName(s)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.section_id?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("passwordLabel")}</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    isInvalid={!!formErrors.password}
                    placeholder={t("leaveBlankToAutogenerate")}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password?.[0]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("confirmPasswordLabel")}</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        password_confirmation: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-muted small">{t("temporaryPasswordNote")}</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? t("creating") : t("createBtn")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ===== PERMISSIONS ===== */}
      <Modal
        show={showPermissions}
        onHide={() => setShowPermissions(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {t("permissionsFor")}
            {editing ? ` — ${editing.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {groupEntries.map(([group, keys]) => (
            <div key={group} className="mb-3">
              <h6 className="fw-bold text-secondary">{group}</h6>
              {keys.map((key) => (
                <Form.Check
                  key={key}
                  type="checkbox"
                  id={`perm-${key}`}
                  label={key}
                  className="mb-1"
                  checked={draftPermissions.includes(key)}
                  onChange={() => togglePermission(key)}
                />
              ))}
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermissions(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={savePermissions} disabled={saving}>
            {saving ? t("saving") : t("managePermissions")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubAdminsManagement;