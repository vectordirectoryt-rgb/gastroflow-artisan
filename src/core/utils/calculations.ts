import { Insumo, Receta } from '../types';

/**
 * Retorna el costo por unidad básica (gramo, mililitro o unidad) de un insumo.
 */
export const getInsumoCostoUnitario = (insumo: Insumo): number => {
  if (!insumo || !insumo.gramos_por_empaque || insumo.gramos_por_empaque <= 0) return 0;
  return insumo.costo_empaque / insumo.gramos_por_empaque;
};

export interface CosteoRecetaResult {
  costoIngredientes: number;
  costoEquipos: number;
  costoCif: number;
  costoDirectoTotal: number;
  costoPorPorcion: number;
  margenBruto: number;
  margenPorcentual: number;
  sueldoPorHora: number;
  precioVenta: number;
}

/**
 * Calcula el escandallo financiero completo de una receta.
 */
export const calculateRecipeCost = (
  receta: Receta,
  insumos: Insumo[],
  tarifaKwh: number = 850
): CosteoRecetaResult => {
  const insumosMap = new Map<string, Insumo>(insumos.map((i) => [i.id, i]));

  // 1. Costo directo de ingredientes y empaques
  const costoIngredientes = receta.ingredientes.reduce((sum, ing) => {
    const insumo = insumosMap.get(ing.insumo_id);
    if (!insumo) return sum;
    return sum + ing.cantidad * getInsumoCostoUnitario(insumo);
  }, 0);

  // 2. Costo de equipos y consumo eléctrico
  const consumoKwhTotal = receta.equipos.reduce((sum, eq) => {
    return sum + (eq.potencia_watts * eq.minutos_uso) / (60 * 1000);
  }, 0);
  const costoEquipos = consumoKwhTotal * tarifaKwh;

  // 3. CIF (Costos indirectos de fabricación)
  const costoCif = costoIngredientes * ((receta.cif_porcentaje || 0) / 100);

  // 4. Costo directo total
  const costoDirectoTotal = costoIngredientes + costoEquipos + costoCif;

  // 5. Por porción base
  const porciones = receta.porciones_base > 0 ? receta.porciones_base : 1;
  const costoPorPorcion = costoDirectoTotal / porciones;

  // 6. Márgenes y ganancia real por hora
  const precioVenta = receta.precio_venta || 0;
  const margenBruto = precioVenta - costoDirectoTotal;
  const margenPorcentual = precioVenta > 0 ? (margenBruto / precioVenta) * 100 : 0;

  const horas = (receta.tiempo_minutos || 0) / 60;
  const sueldoPorHora = horas > 0 ? margenBruto / horas : margenBruto;

  return {
    costoIngredientes,
    costoEquipos,
    costoCif,
    costoDirectoTotal,
    costoPorPorcion,
    margenBruto,
    margenPorcentual,
    sueldoPorHora,
    precioVenta,
  };
};

/**
 * Validador de disponibilidad de ingredientes para tanda de cocina.
 */
export interface DisponibilidadIngrediente {
  insumo: Insumo;
  cantidadRequerida: number;
  stockActual: number;
  suficiente: boolean;
  faltante: number;
}

export const checkBatchAvailability = (
  receta: Receta,
  insumos: Insumo[],
  escala: number = 1
): { items: DisponibilidadIngrediente[]; todoDisponible: boolean } => {
  const insumosMap = new Map<string, Insumo>(insumos.map((i) => [i.id, i]));
  let todoDisponible = true;

  const items: DisponibilidadIngrediente[] = receta.ingredientes.map((ing) => {
    const insumo = insumosMap.get(ing.insumo_id) || {
      id: ing.insumo_id,
      nombre: 'Insumo desconocido',
      unidad: 'g',
      stock_actual: 0,
      stock_min: 0,
      costo_empaque: 0,
      gramos_por_empaque: 1,
    };

    const cantidadRequerida = ing.cantidad * escala;
    const suficiente = insumo.stock_actual >= cantidadRequerida;
    const faltante = suficiente ? 0 : cantidadRequerida - insumo.stock_actual;

    if (!suficiente) {
      todoDisponible = false;
    }

    return {
      insumo,
      cantidadRequerida,
      stockActual: insumo.stock_actual,
      suficiente,
      faltante,
    };
  });

  return { items, todoDisponible };
};
