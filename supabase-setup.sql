	-- ============================================================
-- COOTRANSA · Sistema de Asistencia Biométrico
-- Ejecutar este script en Supabase → SQL Editor
-- ============================================================

-- Tabla de empleados
create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cedula text not null unique,
  cargo text,
  foto_url text,
  descriptor jsonb,              -- vector facial de 128 números (face-api.js)
  activo boolean not null default true,
  created_at timestamptz default now()
);

-- Tabla de marcaciones (entradas/salidas)
create table if not exists marcaciones (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida')),
  timestamp timestamptz not null default now()
);

create index if not exists idx_marcaciones_empleado on marcaciones(empleado_id);
create index if not exists idx_marcaciones_timestamp on marcaciones(timestamp);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table empleados   enable row level security;
alter table marcaciones enable row level security;

-- El KIOSCO funciona sin login (clave anónima): necesita leer empleados
-- e insertar marcaciones. El admin (autenticado) puede todo.

-- Empleados: lectura pública (el kiosco lee los descriptores para reconocer)
create policy "lectura empleados" on empleados
  for select using (true);

-- Empleados: solo usuarios autenticados pueden crear/editar/borrar
create policy "admin gestiona empleados" on empleados
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Marcaciones: el kiosco (anónimo) puede insertar
create policy "kiosco inserta marcaciones" on marcaciones
  for insert with check (true);

-- Marcaciones: lectura para autenticados (reportes)
create policy "admin lee marcaciones" on marcaciones
  for select using (auth.role() = 'authenticated');

-- Marcaciones: el kiosco necesita leer la última marcación del día para saber
-- si toca entrada o salida
create policy "kiosco lee marcaciones" on marcaciones
  for select using (true);

-- Marcaciones: admin puede borrar
create policy "admin borra marcaciones" on marcaciones
  for delete using (auth.role() = 'authenticated');

-- ============================================================
-- LISTO. Crea tu usuario admin en Supabase → Authentication → Add user
-- ============================================================
