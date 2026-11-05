export type TipoInsumo = 'materia_prima' | 'empaque';
export type UnidadInsumo = 'g' | 'kg' | 'ml' | 'l' | 'und';

export interface Insumo {
  id: string;
  nombre: string;
  tipo?: TipoInsumo;
  unidad: UnidadInsumo;
  stock_actual: number;
  stock_min: number;
  costo_empaque: number;
  gramos_por_empaque: number;
  historial_precios?: { fecha: string; costo: number }[];
}

export interface IngredienteReceta {
  insumo_id: string;
  cantidad: number;
}

export interface EquipoReceta {
  nombre: string;
  potencia_watts: number;
  minutos_uso: number;
}

export interface Receta {
  id: string;
  nombre: string;
  porciones_base: number;
  precio_venta: number;
  tiempo_minutos: number;
  cif_porcentaje: number;
  ingredientes: IngredienteReceta[];
  equipos: EquipoReceta[];
}

export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'terminado' | 'entregado';

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  receta_id: string;
  cantidad: number;
  fecha_entrega: string; // YYYY-MM-DD
  hora_entrega: string;  // HH:MM
  notas: string;
  precio_total: number;
  abono: number;
  saldo_pendiente: number;
  estado: EstadoPedido;
  created_at: string;
}

export interface Merma {
  id: string;
  insumo_id: string;
  insumo_nombre: string;
  cantidad: number;
  unidad: string;
  costo_perdido: number;
  motivo: string;
  fecha: string;
}

export interface AppConfig {
  tarifaKwh: number;
  margenMetaDefecto: number;
  metaHorariaDefecto: number;
}

export type VistaNavegacion = 'dashboard' | 'pedidos' | 'cocina' | 'bodega' | 'recetario' | 'historial';
