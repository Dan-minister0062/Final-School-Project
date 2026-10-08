// src/services/classService.js - MySQL-backed class catalog shared by all screens
import { syncGet } from './apiSync';

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

// Fetch raw class rows from MySQL. Returns null when the request fails/empty.
export async function fetchServerClasses() {
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
 * UsersManagement and TeachersManagement: { id, name, nameEn, nameAr, level }.
 * Class rows come from MySQL (GET /classes), so names always come from the DB.
 * `fallbackList` is optional and only used to fill gaps the DB does not have.
 */
export function toCatalogClasses(rows, fallbackList) {
  return rows.map((row) => {
    const id = row.code || String(row.id);
    const fb = Array.isArray(fallbackList)
      ? fallbackList.find((f) => f.id === id)
      : null;
    const levelKey = toCanonicalLevelKey(row.level_key ?? row.levelKey ?? '');
    const nameEn = row.nameEn ?? row.name_en ?? row.name ?? (fb ? fb.nameEn || fb.name : id);
    const nameAr = row.nameAr ?? row.name_ar ?? (fb ? fb.nameAr || fb.name : nameEn);
    return {
      id,
      name: nameEn,
      nameEn,
      nameAr,
      level: levelKey,
      section_id: row.section_id ?? row.sectionId ?? (fb ? fb.section_id ?? null : null),
    };
  });
}

// Fetch raw subject rows from MySQL (GET /subjects). Returns null on failure/empty.
export async function fetchServerSubjects() {
  try {
    const res = await syncGet('/subjects', { limit: 100 });
    const list = Array.isArray(res?.allData)
      ? res.allData
      : Array.isArray(res?.data)
        ? res.data
        : null;
    return list && list.length > 0 ? list : null;
  } catch (err) {
    console.warn('[classService] subjects load failed:', err?.message);
    return null;
  }
}

/**
 * Normalize subject rows into the catalog shape used by admin/teacher screens:
 * { value, code, label, labelAr, name, nameEn, nameAr, level }.
 * Data comes from MySQL; level is canonicalized to a section key.
 */
export function toCatalogSubjects(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const nameEn = row.nameEn ?? row.name_en ?? row.name ?? '';
    const nameAr = row.nameAr ?? row.name_ar ?? '';
    const levelKey = toCanonicalLevelKey(row.level ?? row.level_key ?? row.category ?? '');
    return {
      value: row.code ?? String(row.id),
      code: row.code ?? String(row.id),
      label: nameEn,
      labelAr: nameAr || nameEn,
      name: nameEn,
      nameEn,
      nameAr,
      level: levelKey,
    };
  });
}
