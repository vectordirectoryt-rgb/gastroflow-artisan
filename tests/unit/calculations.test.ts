import { describe, it, expect } from 'vitest';
import {
  getInsumoCostoUnitario,
  calculateRecipeCost,
  checkBatchAvailability,
} from '../../src/core/utils/calculations';
import { Insumo, Receta } from '../../src/core/types';

describe('calculations', () => {
  const mockInsumos: Insumo[] = [
    {
      id: 'ins_1',
      nombre: 'Harina de Trigo',
      unidad: 'g',
      stock_actual: 1000,
      stock_min: 500,
      costo_empaque: 6000,
      gramos_por_empaque: 1000, // 6 COP / g
    },
    {
      id: 'ins_2',
      nombre: 'Mantequilla',
      unidad: 'g',
      stock_actual: 500,
      stock_min: 200,
      costo_empaque: 15000,
      gramos_por_empaque: 500, // 30 COP / g
    },
  ];

  describe('getInsumoCostoUnitario', () => {
    it('calcula correctamente el costo por unidad básica', () => {
      expect(getInsumoCostoUnitario(mockInsumos[0])).toBe(6);
      expect(getInsumoCostoUnitario(mockInsumos[1])).toBe(30);
    });

    it('retorna 0 si los gramos por empaque son inválidos o cero', () => {
      const invalido: Insumo = {
        ...mockInsumos[0],
        gramos_por_empaque: 0,
      };
      expect(getInsumoCostoUnitario(invalido)).toBe(0);
    });
  });

  describe('calculateRecipeCost', () => {
    const mockReceta: Receta = {
      id: 'rec_test',
      nombre: 'Torta Test',
      porciones_base: 2,
      precio_venta: 50000,
      tiempo_minutos: 60, // 1 hora
      cif_porcentaje: 10,
      ingredientes: [
        { insumo_id: 'ins_1', cantidad: 500 }, // 500g * 6 = 3000 COP
        { insumo_id: 'ins_2', cantidad: 200 }, // 200g * 30 = 6000 COP
        // Total ingredientes = 9000 COP
      ],
      equipos: [
        // 2000 W * 30 min = 1 kWh -> a 850 COP/kWh = 850 COP
        { nombre: 'Horno', potencia_watts: 2000, minutos_uso: 30 },
      ],
    };

    it('calcula los costos directos, consumo eléctrico y CIF con precisión', () => {
      const res = calculateRecipeCost(mockReceta, mockInsumos, 850);

      expect(res.costoIngredientes).toBe(9000);
      expect(res.costoEquipos).toBe(850);
      expect(res.costoCif).toBe(900); // 10% de 9000
      expect(res.costoDirectoTotal).toBe(10750); // 9000 + 850 + 900
      expect(res.costoPorPorcion).toBe(5375); // 10750 / 2 porciones
    });

    it('calcula el margen y el sueldo real por hora de la cocinera', () => {
      const res = calculateRecipeCost(mockReceta, mockInsumos, 850);

      // Margen = 50000 - 10750 = 39250 COP
      expect(res.margenBruto).toBe(39250);
      // Margen % = (39250 / 50000) * 100 = 78.5%
      expect(res.margenPorcentual).toBeCloseTo(78.5, 1);
      // Sueldo por hora (en 1 hora) = 39250 COP / hr
      expect(res.sueldoPorHora).toBe(39250);
    });
  });

  describe('checkBatchAvailability', () => {
    const mockReceta: Receta = {
      id: 'rec_test',
      nombre: 'Torta Test',
      porciones_base: 1,
      precio_venta: 50000,
      tiempo_minutos: 60,
      cif_porcentaje: 0,
      ingredientes: [
        { insumo_id: 'ins_1', cantidad: 600 },
        { insumo_id: 'ins_2', cantidad: 300 },
      ],
      equipos: [],
    };

    it('indica disponibilidad positiva cuando el stock cubre la tanda', () => {
      // Stock: ins_1 = 1000, ins_2 = 500. Requerido escala 1: 600 y 300
      const res = checkBatchAvailability(mockReceta, mockInsumos, 1);
      expect(res.todoDisponible).toBe(true);
      expect(res.items[0].suficiente).toBe(true);
      expect(res.items[1].suficiente).toBe(true);
    });

    it('detecta faltantes cuando la escala supera el inventario', () => {
      // Escala 2: ins_1 requiere 1200 (hay 1000 -> falta 200), ins_2 requiere 600 (hay 500 -> falta 100)
      const res = checkBatchAvailability(mockReceta, mockInsumos, 2);
      expect(res.todoDisponible).toBe(false);
      expect(res.items[0].suficiente).toBe(false);
      expect(res.items[0].faltante).toBe(200);
      expect(res.items[1].suficiente).toBe(false);
      expect(res.items[1].faltante).toBe(100);
    });
  });
});
