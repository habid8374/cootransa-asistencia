# COOTRANSA · Sistema de Asistencia Biométrico

Control de asistencia de empleados mediante **reconocimiento facial**, 100% en el navegador.
Sin hardware especial: solo una tablet o computador con cámara.

## Cómo funciona

- **`/kiosco`** — Pantalla para la tablet en la entrada. Reconoce el rostro del empleado y marca entrada/salida automáticamente (alterna según la última marcación del día).
- **`/admin`** — Panel para la administración: registrar empleados (con captura facial), ver y exportar reportes de asistencia a Excel.

## Stack

- React + Vite + TypeScript + Tailwind CSS
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) — reconocimiento facial en el navegador (gratis, sin servicios de pago)
- Supabase — base de datos + autenticación del admin
- Vercel — despliegue

---

## Puesta en marcha

### 1. Variables de entorno
Copia `.env.example` a `.env` y completa con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   (clave anónima legacy, formato JWT)
```

### 2. Base de datos
En Supabase → SQL Editor, ejecuta el contenido de `supabase-setup.sql`.
Luego crea tu usuario admin en Authentication → Add user.

### 3. Modelos de reconocimiento facial
Descarga los modelos de face-api.js y colócalos en `public/models/`:

```bash
mkdir -p public/models
cd public/models
BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
for f in \
  tiny_face_detector_model-weights_manifest.json \
  tiny_face_detector_model-shard1 \
  face_landmark_68_model-weights_manifest.json \
  face_landmark_68_model-shard1 \
  face_recognition_model-weights_manifest.json \
  face_recognition_model-shard1 \
  face_recognition_model-shard2 ; do
  curl -sLO "$BASE/$f"
done
```

### 4. Instalar y correr
```bash
npm install
npm run dev
```

- Admin:  http://localhost:5173/admin
- Kiosco: http://localhost:5173/kiosco

> **Importante:** la cámara solo funciona en `localhost` o sitios con **HTTPS**. En producción (Vercel) funciona automáticamente.

---

## Notas técnicas

- El **descriptor facial** (128 números) se guarda en la base de datos, NO la foto. Es un vector matemático irreversible — no se puede reconstruir el rostro desde él. Mejor para privacidad.
- Umbral de reconocimiento: `0.55` (ajustable en `src/lib/face.ts`). Menor = más estricto.
- El kiosco alterna entrada/salida según la última marcación del día de cada empleado.

## Próximas fases sugeridas

- Notificación SMS al empleado vía Brevo al marcar
- Cálculo automático de horas trabajadas y llegadas tarde
- Múltiples turnos (entrada/almuerzo/regreso/salida)
- Fallback con PIN/cédula si el reconocimiento falla

---

Desarrollado y mantenido por **axentiatech**
