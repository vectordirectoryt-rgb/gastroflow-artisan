import { supabase } from '../lib/supabase';
import { Insumo, Receta, Pedido, Merma, GastoFijo, AppConfig } from '../core/types';

// ==========================================
// INSUMOS (Bodega)
// ==========================================
export async function getInsumosDB(): Promise<Insumo[]> {
  const { data, error } = await supabase.from('insumos').select('*').order('nombre');
  if (error) {
    console.error('Error fetching insumos:', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    unidad: row.unidad,
    stock_actual: Number(row.stock_actual) || 0,
    stock_min: Number(row.stock_min) || 0,
    costo_empaque: Number(row.costo_empaque) || 0,
    gramos_por_empaque: Number(row.gramos_por_empaque) || 1000,
    historial_precios: row.historial_precios || [],
  }));
}

export async function upsertInsumoDB(insumo: Insumo): Promise<void> {
  const { error } = await supabase.from('insumos').upsert({
    id: insumo.id.startsWith('ins_') ? undefined : insumo.id,
    nombre: insumo.nombre,
    tipo: insumo.tipo || 'materia_prima',
    unidad: insumo.unidad,
    stock_actual: insumo.stock_actual,
    stock_min: insumo.stock_min,
    costo_empaque: insumo.costo_empaque,
    gramos_por_empaque: insumo.gramos_por_empaque,
    historial_precios: insumo.historial_precios || [],
  });
  if (error) console.error('Error upserting insumo:', error);
}

// ==========================================
// RECETAS (Recetario, Catálogo y Anaquel)
// ==========================================
export async function getRecetasDB(): Promise<Receta[]> {
  const { data, error } = await supabase
    .from('recetas')
    .select('*')
    .order('prioridad_venta', { ascending: false });
  if (error) {
    console.error('Error fetching recetas:', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria || 'brownies',
    porciones_base: Number(row.porciones_base) || 1,
    precio_venta: Number(row.precio_venta) || 0,
    tiempo_minutos: Number(row.tiempo_minutos) || 60,
    cif_porcentaje: Number(row.cif_porcentaje) || 8,
    ingredientes: row.ingredientes || [],
    equipos: row.equipos || [],
    stock_anaquel: Number(row.stock_anaquel) || 0,
    visible_en_tienda: row.visible_en_tienda ?? true,
    destacado: row.destacado ?? false,
    foto_url: row.foto_url || undefined,
    prioridad_venta: Number(row.prioridad_venta) || 0,
    molde_config: row.molde_config || undefined,
    empaque_reglas: row.empaque_reglas || [],
  }));
}

export async function upsertRecetaDB(receta: Receta): Promise<void> {
  const payload: any = {
    nombre: receta.nombre,
    categoria: receta.categoria || 'brownies',
    porciones_base: receta.porciones_base,
    precio_venta: receta.precio_venta,
    tiempo_minutos: receta.tiempo_minutos,
    cif_porcentaje: receta.cif_porcentaje,
    ingredientes: receta.ingredientes || [],
    equipos: receta.equipos || [],
    stock_anaquel: receta.stock_anaquel || 0,
    visible_en_tienda: receta.visible_en_tienda ?? true,
    destacado: receta.destacado ?? false,
    foto_url: receta.foto_url || null,
    prioridad_venta: receta.prioridad_venta || 0,
    molde_config: receta.molde_config || null,
    empaque_reglas: receta.empaque_reglas || [],
  };

  if (!receta.id.startsWith('rec_')) {
    payload.id = receta.id;
  }

  const { error } = await supabase.from('recetas').upsert(payload);
  if (error) console.error('Error upserting receta:', error);
}

// ==========================================
// PEDIDOS (Encargos y Tienda Online)
// ==========================================
export async function getPedidosDB(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching pedidos:', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    cliente_nombre: row.cliente_nombre,
    cliente_telefono: row.cliente_telefono || '',
    receta_id: row.receta_id,
    cantidad: Number(row.cantidad) || 1,
    fecha_entrega: row.fecha_entrega,
    hora_entrega: row.hora_entrega || '12:00',
    notas: row.notas || '',
    precio_total: Number(row.precio_total) || 0,
    abono: Number(row.abono) || 0,
    saldo_pendiente: Number(row.saldo_pendiente) || 0,
    estado: row.estado,
    origen: row.origen || 'admin',
    empaque_sugerido: row.empaque_sugerido || undefined,
    created_at: row.created_at,
  }));
}

export async function createPedidoDB(pedido: Omit<Pedido, 'id' | 'created_at'>): Promise<Pedido | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .insert([
      {
        cliente_nombre: pedido.cliente_nombre,
        cliente_telefono: pedido.cliente_telefono,
        receta_id: pedido.receta_id,
        cantidad: pedido.cantidad,
        fecha_entrega: pedido.fecha_entrega,
        hora_entrega: pedido.hora_entrega,
        notas: pedido.notas,
        precio_total: pedido.precio_total,
        abono: pedido.abono,
        saldo_pendiente: pedido.saldo_pendiente,
        estado: pedido.estado || 'pendiente',
        origen: pedido.origen || 'admin',
        empaque_sugerido: pedido.empaque_sugerido || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating pedido:', error);
    return null;
  }
  return {
    ...pedido,
    id: data.id,
    created_at: data.created_at,
  };
}

export async function updatePedidoEstadoDB(id: string, estado: string): Promise<void> {
  const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
  if (error) console.error('Error updating pedido estado:', error);
}

export async function updatePedidoCobroDB(id: string, abono: number, saldo_pendiente: number): Promise<void> {
  const { error } = await supabase.from('pedidos').update({ abono, saldo_pendiente }).eq('id', id);
  if (error) console.error('Error updating pedido cobro:', error);
}

// ==========================================
// MERMAS
// ==========================================
export async function getMermasDB(): Promise<Merma[]> {
  const { data, error } = await supabase.from('mermas').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching mermas:', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    insumo_id: row.insumo_id,
    cantidad: Number(row.cantidad) || 0,
    costo_perdido: Number(row.costo_perdido) || 0,
    motivo: row.motivo || '',
    fecha: row.fecha,
  }));
}

export async function createMermaDB(merma: Omit<Merma, 'id'>): Promise<void> {
  const { error } = await supabase.from('mermas').insert([
    {
      insumo_id: merma.insumo_id,
      cantidad: merma.cantidad,
      costo_perdido: merma.costo_perdido,
      motivo: merma.motivo,
      fecha: merma.fecha,
    },
  ]);
  if (error) console.error('Error creating merma:', error);
}

// ==========================================
// GASTOS FIJOS (Publicidad y Otros)
// ==========================================
export async function getGastosFijosDB(): Promise<GastoFijo[]> {
  const { data, error } = await supabase.from('gastos_fijos').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching gastos fijos:', error);
    return [];
  }
  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    monto_cop: Number(row.monto_cop) || 0,
    activo: row.activo ?? true,
    frecuencia: 'mensual',
  }));
}

export async function upsertGastoFijoDB(gasto: Partial<GastoFijo> & { nombre: string; monto_cop: number }): Promise<void> {
  const { error } = await supabase.from('gastos_fijos').upsert({
    id: gasto.id,
    nombre: gasto.nombre,
    monto_cop: gasto.monto_cop,
    activo: gasto.activo ?? true,
    frecuencia: 'mensual',
  });
  if (error) console.error('Error saving gasto fijo:', error);
}

export async function deleteGastoFijoDB(id: string): Promise<void> {
  const { error } = await supabase.from('gastos_fijos').delete().eq('id', id);
  if (error) console.error('Error deleting gasto fijo:', error);
}

// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
export async function getConfigDB(): Promise<AppConfig> {
  const { data, error } = await supabase.from('config_app').select('*').eq('id', 1).single();
  if (error || !data) {
    return { tarifaKwh: 800, margenMetaDefecto: 30, metaHorariaDefecto: 15000 };
  }
  return {
    tarifaKwh: Number(data.tarifa_kwh) || 800,
    margenMetaDefecto: Number(data.margen_meta_defecto) || 30,
    metaHorariaDefecto: Number(data.meta_horaria_defecto) || 15000,
  };
}

export async function saveConfigDB(config: AppConfig): Promise<void> {
  const { error } = await supabase.from('config_app').update({
    tarifa_kwh: config.tarifaKwh,
    margen_meta_defecto: config.margenMetaDefecto,
    meta_horaria_defecto: config.metaHorariaDefecto,
  }).eq('id', 1);
  if (error) console.error('Error saving config:', error);
}

// ==========================================
// SUBIDA DE IMÁGENES A STORAGE
// ==========================================
export async function uploadProductPhotoDB(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('product-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected error in photo upload:', err);
    return null;
  }
}

// ==========================================
// TIEMPO REAL (Realtime)
// ==========================================
export function subscribeToTableRealtime(table: string, onUpdate: () => void) {
  const channel = supabase
    .channel(`realtime_${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

