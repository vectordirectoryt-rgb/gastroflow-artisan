import { describe, it, expect } from 'vitest';
import { calculateTargetDimensions } from '../../src/core/utils/imageOptimizer';

describe('Optimizador de Imágenes (imageOptimizer)', () => {
  it('no altera dimensiones si la imagen ya es menor o igual a maxDimension (1200px)', () => {
    const dims = calculateTargetDimensions(800, 600, 1200);
    expect(dims).toEqual({ width: 800, height: 600 });
  });

  it('escala proporcionalmente una foto horizontal grande (4000x3000 -> 1200x900)', () => {
    const dims = calculateTargetDimensions(4000, 3000, 1200);
    expect(dims.width).toBe(1200);
    expect(dims.height).toBe(900);
  });

  it('escala proporcionalmente una foto vertical de celular (3000x4000 -> 900x1200)', () => {
    const dims = calculateTargetDimensions(3000, 4000, 1200);
    expect(dims.width).toBe(900);
    expect(dims.height).toBe(1200);
  });

  it('escala una imagen cuadrada grande (2048x2048 -> 1200x1200)', () => {
    const dims = calculateTargetDimensions(2048, 2048, 1200);
    expect(dims).toEqual({ width: 1200, height: 1200 });
  });

  it('maneja de forma segura valores extremos o inválidos', () => {
    const dims = calculateTargetDimensions(0, 0, 1200);
    expect(dims.width).toBeGreaterThanOrEqual(1);
    expect(dims.height).toBeGreaterThanOrEqual(1);
  });
});
