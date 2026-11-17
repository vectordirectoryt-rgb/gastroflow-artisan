-- ========================================================
-- GASTROFLOW ARTISAN - "Los Brownies de Josefina"
-- Esquema de Base de Datos para Supabase
-- ========================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA INSUMOS (Bodega)
create table if not exists insumos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  tipo text check (tipo in ('materia_prima','empaque')) default 'materia_prima',
  unidad text check (unidad in ('g','kg','ml','l','und')) not null,
  stock_actual numeric default 0,
  stock_min numeric default 0,
  costo_empaque numeric default 0,
  gramos_por_empaque numeric default 1000,
  historial_precios jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 3. TABLA RECETAS (Recetario, Catálogo y Anaquel)
create table if not exists recetas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  categoria text default 'brownies', -- 'brownies', 'tortas', 'postres', 'otros'
  porciones_base integer default 1,
  precio_venta numeric not null,
  tiempo_minutos integer default 60,
  cif_porcentaje numeric default 8,
  ingredientes jsonb default '[]'::jsonb,
  equipos jsonb default '[]'::jsonb,
  stock_anaquel integer default 0, -- Unidades listas para venta inmediata
  visible_en_tienda boolean default true,
  destacado boolean default false,
  foto_url text,
  prioridad_venta integer default 0,
  molde_config jsonb default null, -- Rendimiento molde y recortes
  empaque_reglas jsonb default '[]'::jsonb, -- Reglas automáticas de cajas
  created_at timestamptz default now()
);

-- 4. TABLA PEDIDOS (Encargos y Tienda Online)
create table if not exists pedidos (
  id uuid default gen_random_uuid() primary key,
  cliente_nombre text not null,
  cliente_telefono text,
  receta_id uuid references recetas(id) on delete set null,
  cantidad integer not null,
  fecha_entrega date not null,
  hora_entrega time,
  notas text,
  precio_total numeric not null,
  abono numeric default 0,
  saldo_pendiente numeric default 0,
  estado text check (estado in ('pendiente','en_preparacion','terminado','entregado','cancelado')) default 'pendiente',
  origen text check (origen in ('admin','cliente')) default 'admin',
  empaque_sugerido jsonb default null,
  created_at timestamptz default now()
);

-- 5. TABLA MERMAS (Desperdicios y Control)
create table if not exists mermas (
  id uuid default gen_random_uuid() primary key,
  insumo_id uuid references insumos(id) on delete cascade,
  cantidad numeric not null,
  costo_perdido numeric default 0,
  motivo text,
  fecha date default current_date,
  created_at timestamptz default now()
);

-- 6. TABLA GASTOS FIJOS (Publicidad y Costos Operativos)
create table if not exists gastos_fijos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  monto_cop numeric not null,
  activo boolean default true,
  frecuencia text default 'mensual',
  created_at timestamptz default now()
);

-- 7. TABLA CONFIG_APP (Parámetros Globales)
create table if not exists config_app (
  id integer primary key default 1,
  tarifa_kwh numeric default 800,
  margen_meta_defecto numeric default 30,
  meta_horaria_defecto numeric default 15000,
  constraint singleton check (id = 1)
);

insert into config_app (id, tarifa_kwh, margen_meta_defecto, meta_horaria_defecto)
values (1, 800, 30, 15000)
on conflict (id) do nothing;

-- 8. STORAGE BUCKET PARA FOTOS DE PRODUCTOS
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
alter table insumos enable row level security;
alter table recetas enable row level security;
alter table pedidos enable row level security;
alter table mermas enable row level security;
alter table gastos_fijos enable row level security;
alter table config_app enable row level security;

-- 10. POLÍTICAS DE ACCESO
-- Políticas para permitir operación con la API Key configurada
create policy "insumos_all" on insumos for all using (true) with check (true);
create policy "recetas_all" on recetas for all using (true) with check (true);
create policy "pedidos_all" on pedidos for all using (true) with check (true);
create policy "mermas_all" on mermas for all using (true) with check (true);
create policy "gastos_fijos_all" on gastos_fijos for all using (true) with check (true);
create policy "config_app_all" on config_app for all using (true) with check (true);

-- Políticas de Storage
create policy "storage_public_view" on storage.objects for select using (bucket_id = 'product-photos');
create policy "storage_upload" on storage.objects for insert with check (bucket_id = 'product-photos');
create policy "storage_update" on storage.objects for update using (bucket_id = 'product-photos');
create policy "storage_delete" on storage.objects for delete using (bucket_id = 'product-photos');

