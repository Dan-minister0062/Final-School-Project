// src/services/classService.js - MySQL-backed class catalog shared by all screens
import { getToken, syncGet } from './apiSync';

// Canonical class codes (exact ids the frontend components already use)
export const CLASS_CODES_BY_LEVEL = {
  kindergarten: [
    'kindergarten_intro',
    'kindergarten_prep1a',
    'kindergarten_prep1b',
    'kindergarten_prep2a',
    'kindergarten_prep2b',
  ],
  primary: [
    'primary_1a', 'primary_1b',
    'primary_2a', 'primary_2b',
    'primary_3a', 'primary_3b',
    'primary_4a', 'primary_4b',
    'primary_5a', 'primary_5b',
    'primary_6a', 'primary_6b',
  ],
  secondary: [
    'secondary_1a', 'secondary_1b',
    'secondary_2a', 'secondary_2b',
    'secondary_3a', 'secondary_3b',
  ],
  high_school: [
    'highschool_common_core',
    'highschool_1st_bac_experimental',
    'highschool_2nd_bac_physical',
  ],
};

// ClassesManagement uses slightly different level keys; map both ways
export function toCanonicalLevelKey(key) {
  if (key === 'kindergarden') return 'kindergarten';
  if (key === 'highSchool') return 'high_school';
  return key || '';
}

export function toMgmtLevelKey(key) {
  if (key === 'kindergarten') return 'kindergarden';
  if (key === 'high_school') return 'highSchool';
  return key || '';
}

// Fetch raw class rows from MySQL. Returns null when offline/demo/empty.
export async function fetchServerClasses() {
  const tk = getToken();
  if (!tk || tk.startsWith('demo-')) return null;
  try {
    const res = await syncGet('/classes');
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data) ? res.data.data : null;
    return list && list.length > 0 ? list : null;
  } catch (err) {
    console.warn('[classService] load failed:', err?.message);
    return null;
  }
}

/**
 * Normalize server rows into the catalog shape used by StudentsManagement,
 * UsersManagement and TeachersManagement: { id, name, level }.
 * `fallbackList` is the component's own hardcoded list — used to localize
 * names exactly as before and as identity for canonical rows.
 */
export function toCatalogClasses(rows, fallbackList) {
  return rows.map((row) => {
    const id = row.code || String(row.id);
    const fb = Array.isArray(fallbackList)
      ? fallbackList.find((f) => f.id === id)
      : null;
    const levelKey = toCanonicalLevelKey(row.level_key ?? row.levelKey ?? '');
    return {
      id,
      name: fb ? fb.name : row.name,
      level: levelKey,
    };
  });
}
