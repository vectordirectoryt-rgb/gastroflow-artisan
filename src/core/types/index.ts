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

export type CategoriaProducto = 'brownies' | 'tortas' | 'postres' | 'otros';

export interface MoldeConfig {
  piezas_por_molde: number;
  peso_o_unidades_recorte: number;
  precio_recorte: number;
}

export interface EmpaqueRegla {
  min_unidades: number;
  max_unidades: number;
  nombre_caja: string;
  insumo_id?: string;
}

export interface Receta {
  id: string;
  nombre: string;
  categoria?: CategoriaProducto;
  porciones_base: number;
  precio_venta: number;
  tiempo_minutos: number;
  cif_porcentaje: number;
  ingredientes: IngredienteReceta[];
  equipos: EquipoReceta[];
  // Stock de Anaquel y Venta Directa
  stock_anaquel?: number;
  // Tienda Pública y Visibilidad
  visible_en_tienda?: boolean;
  destacado?: boolean;
  foto_url?: string;
  prioridad_venta?: number;
  // Rendimiento y moldes
  molde_config?: MoldeConfig;
  // Empaque automático
  empaque_reglas?: EmpaqueRegla[];
}

export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'terminado' | 'entregado' | 'cancelado';
export type OrigenPedido = 'admin' | 'cliente';

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
  origen?: OrigenPedido;
  empaque_sugerido?: {
    nombre_caja: string;
    cantidad_cajas: number;
  };
  created_at: string;
}

export interface Merma {
  id: string;
  insumo_id: string;
  insumo_nombre?: string;
  cantidad: number;
  unidad?: string;
  costo_perdido: number;
  costo_total?: number;
  motivo: string;
  fecha: string;
}

export interface GastoFijo {
  id: string;
  nombre: string;
  monto_cop: number;
  activo: boolean;
  frecuencia: 'mensual';
}

export interface AppConfig {
  tarifaKwh: number;
  margenMetaDefecto: number;
  metaHorariaDefecto: number;
}

export type VistaNavegacion = 'dashboard' | 'pedidos' | 'cocina' | 'bodega' | 'recetario' | 'historial' | 'tienda';
export type ModoApp = 'cliente' | 'admin';
