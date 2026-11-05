import { describe, it, expect } from 'vitest';
import { formatCOP, formatFecha } from '../../src/core/utils/formatters';

describe('formatters', () => {
  describe('formatCOP', () => {
    it('formatea números a formato de pesos colombianos sin decimales', () => {
      expect(formatCOP(85000)).toMatch(/^\$\s*85[.,]000$/);
      expect(formatCOP(1500)).toMatch(/^\$\s*1[.,]500$/);
      expect(formatCOP(0)).toMatch(/^\$\s*0$/);
    });

    it('redondea valores decimales correctamente', () => {
      expect(formatCOP(85000.75)).toMatch(/^\$\s*85[.,]001$/);
      expect(formatCOP(85000.25)).toMatch(/^\$\s*85[.,]000$/);
    });

    it('maneja valores nulos o indefinidos devolviendo $ 0', () => {
      expect(formatCOP(null)).toMatch(/^\$\s*0$/);
      expect(formatCOP(undefined)).toMatch(/^\$\s*0$/);
    });
  });

  describe('formatFecha', () => {
    it('formatea una fecha ISO a DD/MM/AAAA', () => {
      expect(formatFecha('2026-11-05T12:00:00Z')).toBe('05/11/2026');
      expect(formatFecha('2026-12-25')).toBe('25/12/2026');
    });

    it('retorna string vacío si no se suministra fecha', () => {
      expect(formatFecha(undefined)).toBe('');
    });
  });
});
