import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useRbac } from "../../context/RbacContext";
import { getTranslation } from "../../utils/translations";

const FullScreenLoader = () => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(key, language);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "60vh" }}
    >
      <div className="text-center">
        <div
          className="spinner-border text-primary mb-2"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">{t("loading")}</span>
        </div>
        <div className="text-muted small">{t("loading")}</div>
      </div>
    </div>
  );
};

/**
 * Gate a route on one or more RBAC permissions.
 *
 * Client-side only: it hides UI the user cannot use, but the Laravel
 * middleware remains the actual enforcement point.
 */
export const RequirePermission = ({
  permission,
  anyOf = [],
  allOf = [],
  children,
  fallback,
}) => {
  const {
    loaded,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useRbac();
  const location = useLocation();

  if (loading || !loaded) return <FullScreenLoader />;

  const noRequirement = !permission && anyOf.length === 0 && allOf.length === 0;
  const allowed =
    noRequirement ||
    (!!permission && hasPermission(permission)) ||
    (anyOf.length > 0 && hasAnyPermission(anyOf)) ||
    (allOf.length > 0 && hasAllPermissions(allOf));

  if (!allowed) {
    return (
      <Navigate to={fallback || "/dashboard"} replace state={{ from: location }} />
    );
  }

  return children;
};

/** Gate a route on the admin tier (Super Admin or Sub-Admin). */
export const RequireAdmin = ({ children, fallback }) => {
  const { loaded, loading, isAdmin } = useRbac();
  const location = useLocation();

  if (loading || !loaded) return <FullScreenLoader />;

  if (!isAdmin) {
    return (
      <Navigate to={fallback || "/dashboard"} replace state={{ from: location }} />
    );
  }

  return children;
};

/**
 * Gate a route on the Super Admin tier. Used for admin lifecycle, permissions,
 * section management and the audit log, all of which are super-only server-side.
 */
export const RequireSuperAdmin = ({ children, fallback }) => {
  const { loaded, loading, isSuperAdmin } = useRbac();
  const location = useLocation();

  if (loading || !loaded) return <FullScreenLoader />;

  if (!isSuperAdmin) {
    return (
      <Navigate
        to={fallback || "/dashboard/admin"}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

/** Gate a route on a Sub-Admin being pinned to their own section. */
export const RequireSubAdmin = ({ children, fallback }) => {
  const { loaded, loading, isSubAdmin } = useRbac();
  const location = useLocation();

  if (loading || !loaded) return <FullScreenLoader />;

  if (!isSubAdmin) {
    return (
      <Navigate
        to={fallback || "/dashboard/admin"}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

export default RequirePermission;