/**
 * Adaptador seguro de persistencia para LocalStorage con tipos y valores por defecto.
 */
export const safeLoad = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error al leer ${key} de localStorage:`, e);
    return fallback;
  }
};

export const safeSave = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error al guardar ${key} en localStorage:`, e);
  }
};
