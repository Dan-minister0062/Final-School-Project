import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { fetchMyRbac } from "../services/rbacService";

export const RbacContext = createContext(null);

// Safe defaults so a component can never crash on a missing provider.
const GUEST = {
  loaded: false,
  loading: false,
  rbac: null,
  tier: "guest",
  role: null,
  section: null,
  sectionId: null,
  sectionKey: null,
  sectionName: null,
  sectionScope: null,
  permissions: [],
  can: {},
  isSuperAdmin: false,
  isSubAdmin: false,
  isAdmin: false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refresh: async () => {},
};

export const RbacProvider = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const authStatus = useSelector((state) => state.auth.status);

  const [rbac, setRbac] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyRbac();
      setRbac(data);
      return data;
    } catch {
      // A failed capability lookup must never grant access, so fall back to
      // guest. The server still rejects every request regardless.
      setRbac(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait until the session check settles: fetching early would race the
    // cookie restore and log the user out via the 401 interceptor.
    if (!isAuthenticated || authStatus === "checking") {
      setRbac(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchMyRbac()
      .then((data) => {
        if (active) setRbac(data);
      })
      .catch(() => {
        if (active) setRbac(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, authStatus, userId]);

  const value = useMemo(() => {
    if (!rbac) {
      return {
        ...GUEST,
        loading,
        // While the capability payload is in flight, treat as not-yet-loaded so
        // guards wait instead of redirecting a legitimate user.
        loaded: !loading && !isAuthenticated,
      };
    }

    const can =
      rbac.can && typeof rbac.can === "object" && !Array.isArray(rbac.can)
        ? rbac.can
        : {};
    const permissions = Array.isArray(rbac.permissions) ? rbac.permissions : [];
    const isSuperAdmin = !!rbac.is_super_admin;
    const isSubAdmin = !!rbac.is_sub_admin;

    // Super Admins implicitly hold every capability, including the ones the
    // server marks as super-only.
    const hasPermission = (permission) => {
      if (!permission) return false;
      if (isSuperAdmin) return true;
      return !!(can[permission] || permissions.includes(permission));
    };

    const hasAnyPermission = (list) =>
      Array.isArray(list) && list.some((p) => hasPermission(p));
    const hasAllPermissions = (list) =>
      Array.isArray(list) && list.length > 0 && list.every((p) => hasPermission(p));

    return {
      loaded: true,
      loading,
      rbac,
      tier: rbac.tier || (isSuperAdmin ? "super_admin" : isSubAdmin ? "sub_admin" : rbac.role),
      role: rbac.role ?? null,
      section: rbac.section ?? null,
      sectionId: rbac.section_id ?? null,
      sectionKey: rbac.section?.key ?? null,
      sectionName: rbac.section?.name ?? null,
      sectionScope: rbac.section_scope ?? null,
      permissions,
      can,
      isSuperAdmin,
      isSubAdmin,
      isAdmin: isSuperAdmin || isSubAdmin,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refresh,
    };
  }, [rbac, loading, isAuthenticated, refresh]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
};

export const useRbac = () => useContext(RbacContext) ?? GUEST;

export default RbacProvider;