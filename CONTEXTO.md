# CONTEXTO DEL PROYECTO — Para retomar en otra sesión de Claude Code

> Lee este archivo completo antes de trabajar. Resume qué es el proyecto, cómo está
> construido, qué decisiones se tomaron y qué falta. Así puedes continuar sin repetir trabajo.

---

## Qué es

**Sistema de control de asistencia biométrico para COOTRANSA Ltda.** (Cooperativa de
Transportadores de Sabanalarga, Atlántico, Colombia). Registra entrada/salida de empleados
mediante **reconocimiento facial**, 100% en el navegador. Sin hardware especial: solo una
tablet o computador con cámara.

Es un **proyecto independiente** (aparte de la página web pública de COOTRANSA que ya existe
en otro repo). Se cobra y mantiene por separado.

**Cliente:** la suegra del dueño trabaja en COOTRANSA y solicitó el sistema. Hay relación
comercial activa — ya se entregó la página web institucional de la cooperativa.

---

## Stack técnico

- **React 18 + Vite + TypeScript + Tailwind CSS 3** — `vite build` (NO `tsc &&`)
- **face-api.js** — reconocimiento facial en el navegador (TinyFaceDetector + landmarks + recognition). Gratis, sin servicios de pago.
- **Supabase** — PostgreSQL + Auth (login del admin). Proyecto: `yrsvbddlvhegozoxgmya`
- **Vercel** — despliegue (deploy automático desde `main`)
- Iconos: `lucide-react`. Ruteo: `react-router-dom` v6.

---

## Arquitectura / rutas

- **`/kiosco`** (`src/pages/Kiosco.tsx`) — Pantalla para la tablet en la entrada. Reloj en
  vivo, cámara abierta, reconoce el rostro y marca entrada/salida automáticamente. Alterna
  entrada↔salida según la última marcación del día del empleado. Pantalla verde de
  confirmación con nombre + hora. NO requiere login (usa la clave anónima de Supabase).
- **`/admin`** (`src/pages/admin/AdminPanel.tsx`) — Login con Supabase. Dos pestañas:
  - **Empleados**: lista + registrar (con captura facial vía `RegistrarEmpleado.tsx`) + eliminar
  - **Reportes**: marcaciones agrupadas por día y por empleado, con cálculo de horas
    trabajadas (suma pares entrada→salida). Exportar a CSV/Excel.
- **`/`** y `*` → redirigen a `/admin`.

### Archivos clave
- `src/lib/supabase.ts` — cliente + tipos `Empleado` y `Marcacion`
- `src/lib/face.ts` — `loadModels()`, `getDescriptor()`, `matchDescriptor()`. Umbral 0.55. inputSize 224.
- `src/hooks/useCamera.ts` — hook de cámara (getUserMedia)
- `src/App.tsx` — rutas + guard de sesión Supabase
- `supabase-setup.sql` — tablas `empleados` + `marcaciones` con RLS (ya ejecutado en Supabase)
- `public/models/` — modelos de face-api.js (ya descargados, NO borrar)

---

## Decisiones importantes

1. **Privacidad por diseño:** se guarda solo el **descriptor facial** (128 números float),
   NO la foto. Es un vector matemático irreversible — no se puede reconstruir el rostro.
   Esto protege legalmente con la Ley 1581 de datos personales colombiana.
2. **Llave de Supabase:** usar la **legacy anon key** (formato JWT `eyJ...`), NO la nueva
   `sb_publishable_...` — esa última da error "Invalid API key" con el login.
   Está en Supabase → Settings → API Keys → pestaña "Legacy anon, service_role API keys".
3. **El kiosco funciona sin login** (clave anónima). Las RLS permiten al anónimo leer
   empleados e insertar/leer marcaciones; solo el admin autenticado gestiona empleados.
4. **Reconocimiento:** se priorizó velocidad bajando inputSize de 320 a 224.

---

## Variables de entorno (.env — NO subir al repo, está en .gitignore)

```
VITE_SUPABASE_URL=https://yrsvbddlvhegozoxgmya.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...   (legacy anon key)
```
En Vercel se configuran en Environment Variables.

---

## Estado actual (lo que YA funciona)

- ✅ Login admin con Supabase
- ✅ Registro de empleados con captura facial
- ✅ Kiosco reconoce rostro y marca entrada/salida
- ✅ Reportes agrupados por día/empleado con horas trabajadas
- ✅ Exportar a Excel/CSV
- ✅ Código en GitHub: `habid8374/cootransa-asistencia` (rama `main`)
- 🔄 Pendiente de desplegar/probar en Vercel

---

## Próximas fases sugeridas (NO construidas aún)

1. **SMS al empleado vía Brevo** al marcar (entrada/salida confirmada por mensaje)
2. **Llegadas tarde / tardanzas** — comparar contra horario esperado
3. **Múltiples turnos** (entrada / salida almuerzo / regreso / salida final)
4. **Fallback con PIN o cédula** si el reconocimiento facial falla
5. **Rol "estación"** (relacionado con otra idea: sistema de saldo prepago con QR para
   clientes frecuentes de COOTRANSA — proyecto separado, en evaluación con el gerente)

---

## Notas comerciales

- Precio sugerido para este sistema: **$2.5M–$4M COP desarrollo único + $150K–$250K COP/mes** mantenimiento.
- Marca/desarrollador: **axentiatech** (soporte@axentiatech.com)
- Hay reunión pendiente con el gerente de COOTRANSA para aprobar este y otros módulos.

---

## Convención de commits del proyecto

Mensajes claros en español, descriptivos. Trabajar en `main` (o la rama que indique la sesión).
Build de verificación: `npx vite build` debe pasar limpio antes de cada push.
