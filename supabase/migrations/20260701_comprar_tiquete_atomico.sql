-- Compra atómica de tiquete: decrementa cupos y crea el tiquete en una sola transacción.
-- Previene sobreventa por accesos concurrentes (race condition).
CREATE OR REPLACE FUNCTION comprar_tiquete(
  p_viaje_id        UUID,
  p_pasajero_id     UUID,
  p_precio          NUMERIC,
  p_estado          TEXT,
  p_metodo_pago     TEXT,
  p_referencia_pago TEXT    DEFAULT NULL,
  p_parada_origen   TEXT    DEFAULT NULL,
  p_parada_destino  TEXT    DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tiquete_id UUID;
BEGIN
  -- Decrementar cupos solo si aún hay disponibles (operación atómica en BD)
  UPDATE viajes
     SET capacidad_disponible = capacidad_disponible - 1
   WHERE id = p_viaje_id
     AND capacidad_disponible > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sin cupos disponibles';
  END IF;

  -- Insertar el tiquete
  INSERT INTO tiquetes (
    viaje_id, pasajero_id, precio, estado,
    metodo_pago, referencia_pago, parada_origen, parada_destino
  ) VALUES (
    p_viaje_id, p_pasajero_id, p_precio, p_estado,
    p_metodo_pago, p_referencia_pago, p_parada_origen, p_parada_destino
  ) RETURNING id INTO v_tiquete_id;

  RETURN v_tiquete_id;
END;
$$;

-- Permitir ejecución desde el rol anon (público, ya que tiquetes es público)
GRANT EXECUTE ON FUNCTION comprar_tiquete TO anon, authenticated;
