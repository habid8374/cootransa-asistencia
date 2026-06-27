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
  pin text,                      -- PIN de 4 dígitos (respaldo si falla reconocimiento facial)
  hora_entrada text,             -- HH:MM hora esperada de llegada
  hora_salida text,              -- HH:MM hora esperada de salida
  activo boolean not null default true,
  created_at timestamptz default now()
);

-- Si ya tienes la tabla creada, ejecuta estas migraciones:
-- alter table empleados add column if not exists pin text;
-- alter table empleados add column if not exists hora_entrada text;
-- alter table empleados add column if not exists hora_salida text;
-- alter table empleados add column if not exists foto_url text;

-- Tabla de marcaciones (entradas/salidas)
create table if not exists marcaciones (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida')),
  timestamp timestamptz not null default now()
);

create index if not exists idx_marcaciones_empleado on marcaciones(empleado_id);
create index if not exists idx_marcaciones_timestamp on marcaciones(timestamp);

-- Tabla de permisos (excusas de asistencia)
create table if not exists permisos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  hora_inicio time,  -- null = día completo
  hora_fin time,     -- null = día completo
  created_at timestamptz default now()
);

create index if not exists idx_permisos_empleado on permisos(empleado_id);
create index if not exists idx_permisos_fecha on permisos(fecha);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table empleados   enable row level security;
alter table marcaciones enable row level security;
alter table permisos    enable row level security;

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

-- Permisos: solo admin gestiona
create policy "admin gestiona permisos" on permisos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Permisos: lectura pública (el dashboard y reportes los necesitan)
create policy "lectura permisos" on permisos
  for select using (true);

-- ============================================================
-- TURNOS Y TIPOS DE EMPLEADO (ejecutar si no existen)
-- ============================================================

-- Tipos de empleado (Operativo, Administrativo, Conductor, etc.)
create table if not exists tipos_empleado (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz default now()
);

-- Turnos con horario diferenciado por tipo de día
create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_empleado_id uuid references tipos_empleado(id) on delete set null,
  hora_entrada_lv text,       -- Lunes–Viernes (null = no trabaja)
  hora_salida_lv text,
  hora_entrada_sab text,      -- Sábado
  hora_salida_sab text,
  hora_entrada_dom text,      -- Domingo
  hora_salida_dom text,
  hora_entrada_festivo text,  -- Festivos
  hora_salida_festivo text,
  created_at timestamptz default now()
);

-- Festivos colombianos
create table if not exists festivos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  nombre text not null,
  created_at timestamptz default now()
);

create index if not exists idx_festivos_fecha on festivos(fecha);

-- Asignaciones de turno por empleado y período (soporta rotación mensual)
create table if not exists empleado_turnos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete cascade,
  turno_id uuid not null references turnos(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin date not null,
  created_at timestamptz default now(),
  constraint fechas_validas check (fecha_inicio <= fecha_fin)
);

create index if not exists idx_empleado_turnos_emp on empleado_turnos(empleado_id);
create index if not exists idx_empleado_turnos_fechas on empleado_turnos(fecha_inicio, fecha_fin);

-- Agregar columna tipo_empleado_id a empleados
alter table empleados add column if not exists tipo_empleado_id uuid references tipos_empleado(id) on delete set null;

-- RLS para nuevas tablas
alter table tipos_empleado   enable row level security;
alter table turnos            enable row level security;
alter table festivos          enable row level security;
alter table empleado_turnos   enable row level security;

-- Lectura pública (terminal necesita saber el horario del empleado)
create policy "lectura tipos_empleado"  on tipos_empleado  for select using (true);
create policy "lectura turnos"          on turnos           for select using (true);
create policy "lectura festivos"        on festivos         for select using (true);
create policy "lectura empleado_turnos" on empleado_turnos  for select using (true);

-- Solo admin puede gestionar
create policy "admin gestiona tipos_empleado"  on tipos_empleado  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin gestiona turnos"          on turnos           for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin gestiona festivos"        on festivos         for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin gestiona empleado_turnos" on empleado_turnos  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- LISTO. Crea tu usuario admin en Supabase → Authentication → Add user
-- ============================================================
