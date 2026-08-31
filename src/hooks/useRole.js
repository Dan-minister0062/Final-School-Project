import { useSelector } from 'react-redux';

export const useRole = () => {
  const role = useSelector((state) => state.auth.role);

  const isDirector = role === 'director';
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isParent = role === 'parent';
  const isStudent = role === 'student';

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(role);
  };

  return {
    role,
    isDirector,
    isAdmin,
    isTeacher,
    isParent,
    isStudent,
    hasRole,
  };
};