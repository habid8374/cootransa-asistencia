-- L-2: Restringir inserts en marcaciones a timestamps recientes
-- Impide que alguien con la anon key falsifique registros backdatados

DROP POLICY IF EXISTS "marcaciones_anon_insert_recent" ON marcaciones;
DROP POLICY IF EXISTS "marcaciones_anon_select"        ON marcaciones;
DROP POLICY IF EXISTS "marcaciones_authenticated_all"  ON marcaciones;

ALTER TABLE marcaciones ENABLE ROW LEVEL SECURITY;

-- Administradores (authenticated): acceso completo
CREATE POLICY "marcaciones_authenticated_all"
ON marcaciones FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Terminal (anon): puede leer para determinar sentido entrada/salida
CREATE POLICY "marcaciones_anon_select"
ON marcaciones FOR SELECT
TO anon
USING (true);

-- Terminal (anon): solo puede insertar timestamps dentro de los últimos 5 min
-- Previene registros backdatados o futuros vía API directa
CREATE POLICY "marcaciones_anon_insert_recent"
ON marcaciones FOR INSERT
TO anon
WITH CHECK (
  timestamp >= (NOW() - INTERVAL '5 minutes')
  AND timestamp <= (NOW() + INTERVAL '1 minute')
);
