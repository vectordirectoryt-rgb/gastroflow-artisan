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

export interface FotoPresentacion {
  url: string;
  etiqueta: string; // ej: "Porción Cuadrada", "Forma Corazón", "Empaque Individual", "Cajita de Regalo"
  tipo?: 'forma' | 'empaque' | 'tamano' | 'general';
}

export interface OpcionVariante {
  id: string;
  nombre: string;
  precio_adicional: number;
  foto_idx?: number;
  descripcion?: string;
}

export interface GrupoVariante {
  id: string;
  titulo: string;
  tipo: 'tamano' | 'forma' | 'empaque';
  opciones: OpcionVariante[];
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
  fotos_presentacion?: FotoPresentacion[];
  grupos_variantes?: GrupoVariante[];
  prioridad_venta?: number;
  // Rendimiento y moldes
  molde_config?: MoldeConfig;
  // Empaque automático
  empaque_reglas?: EmpaqueRegla[];
}

export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'terminado' | 'entregado' | 'cancelado';
export type OrigenPedido = 'admin' | 'cliente';
export type MetodoEntrega = 'recoger' | 'domicilio';
export type ModoEntregaMixta = 'todo_junto' | 'separado';

export interface ItemPedido {
  id?: string;
  receta_id: string;
  receta_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  detalles_variante?: string; // ej: "Individual | Forma Corazón | Cajita de Regalo"
  foto_url?: string;
  empaque_sugerido?: {
    nombre_caja: string;
    cantidad_cajas: number;
  };
}

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  receta_id: string; // Compatibilidad hacia atrás (primer producto o único)
  cantidad: number;  // Compatibilidad hacia atrás
  items?: ItemPedido[]; // Lista de productos del carrito
  metodo_entrega?: MetodoEntrega;
  direccion_entrega?: string;
  barrio_entrega?: string;
  mensaje_tarjeta?: string; // Dedicatoria de regalo
  modo_entrega_mixta?: ModoEntregaMixta;
  fecha_entrega: string; // YYYY-MM-DD
  hora_entrega: string;  // HH:MM
  fecha_entrega_secundaria?: string; // Si elige entregas separadas para hoy y mañana
  hora_entrega_secundaria?: string;
  notas: string;
  precio_total: number;
  abono: number;
  saldo_pendiente: number;
  estado: EstadoPedido;
  origen?: OrigenPedido;
  insumos_descontados?: boolean;
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

export interface ThemeBranding {
  logoUrl?: string;
  eslogan?: string;
  subtitulo?: string;
  paletaId?: 'josefina' | 'pastel' | 'caramelo' | 'menta';
  tipografiaId?: 'serif' | 'sans' | 'clasica';
  porcentajeAnticipo?: number; // 50 o 100
  telefonoWhatsApp?: string;
  nequiNumero?: string;
  bancolombiaNumero?: string;
  direccionTaller?: string;
}

export interface AppConfig {
  tarifaKwh: number;
  margenMetaDefecto: number;
  metaHorariaDefecto: number;
  branding?: ThemeBranding;
}

export type VistaNavegacion = 'dashboard' | 'pedidos' | 'cocina' | 'bodega' | 'recetario' | 'historial' | 'tienda';
export type ModoApp = 'cliente' | 'admin';
