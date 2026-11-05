import { Insumo, Receta, AppConfig } from '../types';

export const INITIAL_CONFIG: AppConfig = {
  tarifaKwh: 850,
  margenMetaDefecto: 35,
  metaHorariaDefecto: 25000,
};

export const INITIAL_INSUMOS: Insumo[] = [
  { id: 'ins_1', nombre: 'Harina de Trigo Repostera', unidad: 'g', stock_actual: 4500, stock_min: 3000, costo_empaque: 6500, gramos_por_empaque: 1000 },
  { id: 'ins_2', nombre: 'Mantequilla sin Sal 82%', unidad: 'g', stock_actual: 850, stock_min: 1500, costo_empaque: 18000, gramos_por_empaque: 500 },
  { id: 'ins_3', nombre: 'Azúcar Blanca Refinada', unidad: 'g', stock_actual: 5000, stock_min: 2000, costo_empaque: 5200, gramos_por_empaque: 1000 },
  { id: 'ins_4', nombre: 'Huevos AA (Unidad)', unidad: 'und', stock_actual: 24, stock_min: 30, costo_empaque: 21000, gramos_por_empaque: 30 },
  { id: 'ins_5', nombre: 'Chocolate de Cobertura 58%', unidad: 'g', stock_actual: 600, stock_min: 1200, costo_empaque: 34000, gramos_por_empaque: 1000 },
  { id: 'ins_6', nombre: 'Crema de Leche 35% MG', unidad: 'g', stock_actual: 1200, stock_min: 1000, costo_empaque: 14500, gramos_por_empaque: 1000 },
  { id: 'ins_7', nombre: 'Caja para Torta 25x25 + Blonda', unidad: 'und', stock_actual: 8, stock_min: 10, costo_empaque: 45000, gramos_por_empaque: 10 },
];

export const INITIAL_RECETAS: Receta[] = [
  {
    id: 'rec_1',
    nombre: 'Torta Selva Negra Artesanal (12-15 Porciones)',
    porciones_base: 1,
    precio_venta: 85000,
    tiempo_minutos: 90,
    cif_porcentaje: 8,
    ingredientes: [
      { insumo_id: 'ins_1', cantidad: 350 },
      { insumo_id: 'ins_2', cantidad: 220 },
      { insumo_id: 'ins_3', cantidad: 300 },
      { insumo_id: 'ins_4', cantidad: 5 },
      { insumo_id: 'ins_5', cantidad: 300 },
      { insumo_id: 'ins_6', cantidad: 400 },
      { insumo_id: 'ins_7', cantidad: 1 },
    ],
    equipos: [
      { nombre: 'Horno Eléctrico Convector', potencia_watts: 2400, minutos_uso: 50 },
      { nombre: 'Batidora Planetaria', potencia_watts: 450, minutos_uso: 25 },
    ],
  },
  {
    id: 'rec_2',
    nombre: 'Galletas Chispas de Chocolate (Caja x 12 und)',
    porciones_base: 12,
    precio_venta: 42000,
    tiempo_minutos: 45,
    cif_porcentaje: 6,
    ingredientes: [
      { insumo_id: 'ins_1', cantidad: 280 },
      { insumo_id: 'ins_2', cantidad: 170 },
      { insumo_id: 'ins_3', cantidad: 200 },
      { insumo_id: 'ins_4', cantidad: 2 },
      { insumo_id: 'ins_5', cantidad: 220 },
      { insumo_id: 'ins_7', cantidad: 1 },
    ],
    equipos: [
      { nombre: 'Horno Eléctrico Convector', potencia_watts: 2400, minutos_uso: 20 },
      { nombre: 'Batidora Planetaria', potencia_watts: 450, minutos_uso: 15 },
    ],
  },
];
