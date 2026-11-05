/**
 * Formatea un valor numérico a Moneda Colombiana (COP).
 * Ejemplo: 85000 -> "$ 85.000"
 */
export const formatCOP = (val: number | string | null | undefined): string => {
  const num = Math.round(Number(val) || 0);
  return '$ ' + num.toLocaleString('es-CO');
};

/**
 * Formatea una fecha ISO a formato legible en español.
 */
export const formatFecha = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const [year, month, day] = isoString.split('T')[0].split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return isoString;
  } catch {
    return isoString || '';
  }
};
