import { Monitor, Users, ShieldCheck, ClipboardList, BarChart3, TrendingUp, Settings, LogIn, HelpCircle, Printer } from 'lucide-react'

const SECCIONES = [
  { id: 'acceso',      label: 'Acceso al sistema',    icon: <LogIn size={14} /> },
  { id: 'hoy',         label: 'Panel de hoy',          icon: <Monitor size={14} /> },
  { id: 'empleados',   label: 'Empleados',             icon: <Users size={14} /> },
  { id: 'permisos',    label: 'Permisos',              icon: <ShieldCheck size={14} /> },
  { id: 'reportes',    label: 'Reportes',              icon: <ClipboardList size={14} /> },
  { id: 'mensual',     label: 'Resumen mensual',       icon: <BarChart3 size={14} /> },
  { id: 'tendencias',  label: 'Tendencias',            icon: <TrendingUp size={14} /> },
  { id: 'config',      label: 'Configuración',         icon: <Settings size={14} /> },
  { id: 'terminal',    label: 'Terminal de marcación', icon: <Monitor size={14} /> },
  { id: 'faq',         label: 'Preguntas frecuentes',  icon: <HelpCircle size={14} /> },
]

function Titulo({ id, numero, children }: { id: string; numero: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-xl font-bold text-gray-900 mt-10 mb-4 scroll-mt-6">
      <span className="w-8 h-8 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{numero}</span>
      {children}
    </h2>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-gray-800 mt-6 mb-2">{children}</h3>
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-2">
      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
    </div>
  )
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg px-4 py-3 my-4">
      <p className="text-sm text-blue-800 leading-relaxed"><span className="font-bold">Nota: </span>{children}</p>
    </div>
  )
}

function Advertencia({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-lg px-4 py-3 my-4">
      <p className="text-sm text-orange-800 leading-relaxed"><span className="font-bold">Importante: </span>{children}</p>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>
}

export default function ManualUsuario() {
  return (
    <div className="max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="bg-gray-900 rounded-2xl p-8 mb-8 print:rounded-none print:mb-4">
        <div className="flex items-center gap-3 mb-3">
          <img src="/favicon.png" alt="COOTRANSA" className="w-10 h-10 rounded-full object-contain shrink-0" />
          <p className="text-white text-xs font-bold uppercase tracking-widest">Manual de usuario</p>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Sistema de Control de Asistencia</h1>
        <p className="text-gray-400 text-sm mt-2">COOTRANSA Ltda. · 2026</p>
        <button
          onClick={() => window.print()}
          className="mt-5 flex items-center gap-2 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition print:hidden"
        >
          <Printer size={15} /> Descargar / Imprimir PDF
        </button>
      </div>

      <div className="flex gap-8">

        {/* Índice lateral — solo pantalla */}
        <aside className="hidden lg:block w-52 shrink-0 print:hidden">
          <div className="sticky top-4 bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contenido</p>
            <nav className="space-y-0.5">
              {SECCIONES.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition"
                >
                  <span className="text-gray-400">{s.icon}</span>
                  <span>{i + 1}. {s.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenido */}
        <div className="flex-1 min-w-0">

          {/* ── 1. ACCESO ── */}
          <Titulo id="acceso" numero="1">Acceso al sistema</Titulo>
          <P>El panel de administración es la herramienta principal para gestionar la asistencia del personal. Se accede desde cualquier navegador web, sin necesidad de instalar ningún programa.</P>
          <Sub>¿Cómo ingresar?</Sub>
          <Paso n={1}>Abra el navegador (Chrome, Edge o Safari) e ingrese la dirección del sistema: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">cootransa-asistencia.vercel.app/admin</span></Paso>
          <Paso n={2}>Escriba su correo electrónico y contraseña en el formulario de ingreso.</Paso>
          <Paso n={3}>Presione <strong>Iniciar sesión</strong>. El sistema lo llevará directamente al panel principal.</Paso>
          <Nota>Si olvidó su contraseña, comuníquese con el administrador del sistema para restablecerla.</Nota>
          <Sub>Cerrar sesión</Sub>
          <P>Al terminar su jornada, cierre la sesión desde el botón <strong>Cerrar sesión</strong> ubicado en la parte inferior del menú lateral izquierdo. Esto protege la información del personal.</P>

          {/* ── 2. HOY ── */}
          <Titulo id="hoy" numero="2">Panel de hoy</Titulo>
          <P>Es la primera pantalla que verá al ingresar. Muestra en tiempo real el estado de asistencia del personal durante el día actual.</P>
          <Sub>¿Qué muestra?</Sub>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              ['Presentes', 'Empleados que ya marcaron entrada y están actualmente en la sede.'],
              ['Ausentes', 'Empleados que aún no han marcado entrada en el día.'],
              ['Con permiso', 'Empleados que tienen un permiso registrado para hoy.'],
              ['Ya salieron', 'Empleados que marcaron salida durante el día.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-1">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
          </div>
          <Nota>Esta pantalla se actualiza automáticamente. No es necesario recargar la página para ver los cambios más recientes.</Nota>

          {/* ── 3. EMPLEADOS ── */}
          <Titulo id="empleados" numero="3">Empleados</Titulo>
          <P>Desde esta sección se administra todo el personal de la cooperativa. Los empleados aparecen organizados por categoría (Administrativo, Operativo, Conductor, etc.) en grupos que se pueden expandir o colapsar con un clic.</P>

          <Sub>Registrar un empleado nuevo</Sub>
          <Paso n={1}>Presione el botón verde <strong>Registrar empleado</strong> en la parte superior derecha.</Paso>
          <Paso n={2}>Se abrirá una ventana con la cámara activada. Pida al empleado que se ubique frente a la pantalla y presione <strong>Capturar rostro y foto</strong>. El sistema detectará automáticamente el rostro.</Paso>
          <Paso n={3}>Complete los datos: nombre completo, cédula, cargo, categoría y horario de entrada y salida.</Paso>
          <Paso n={4}>Si lo desea, asigne un <strong>PIN de 4 dígitos</strong> como respaldo en caso de que el reconocimiento facial falle.</Paso>
          <Paso n={5}>Presione <strong>Guardar empleado</strong>.</Paso>
          <Advertencia>La hora de entrada y salida es obligatoria. Es la base para calcular tardanzas, salidas anticipadas y horas extra.</Advertencia>

          <Sub>Editar un empleado</Sub>
          <Paso n={1}>Expanda la categoría del empleado y localícelo en la lista.</Paso>
          <Paso n={2}>Presione el botón <strong>Editar</strong> en la tarjeta del empleado.</Paso>
          <Paso n={3}>Modifique los datos que necesite y presione <strong>Guardar cambios</strong>.</Paso>

          <Sub>Ver historial de un empleado</Sub>
          <Paso n={1}>Presione el botón <strong>Historial</strong> en la tarjeta del empleado.</Paso>
          <Paso n={2}>Verá todas las marcaciones registradas: fechas, horas de entrada y salida, tardanzas y permisos.</Paso>

          <Sub>Desactivar o reactivar un empleado</Sub>
          <P>Cuando un empleado se ausenta temporalmente (incapacidad, licencia, etc.) puede desactivarlo sin perder su historial. Un empleado inactivo no puede marcar en el terminal pero conserva todos sus registros.</P>
          <Paso n={1}>Presione el botón <strong>Desactivar</strong> en la tarjeta del empleado.</Paso>
          <Paso n={2}>Confirme la acción en la ventana que aparece.</Paso>
          <Paso n={3}>Para reactivarlo, presione el botón <strong>Reactivar</strong> (aparece en verde en los empleados inactivos).</Paso>
          <Nota>Los empleados inactivos aparecen en la lista solo si activa la opción <strong>Ver inactivos</strong>.</Nota>

          <Sub>Eliminar un empleado</Sub>
          <Advertencia>Eliminar un empleado borra permanentemente todos sus registros de asistencia. Esta acción no se puede deshacer. Si el empleado puede volver, use <strong>Desactivar</strong> en lugar de eliminar.</Advertencia>
          <Paso n={1}>Presione el botón <strong>Eliminar</strong> en la tarjeta del empleado.</Paso>
          <Paso n={2}>Lea con atención la advertencia y confirme solo si está seguro.</Paso>

          {/* ── 4. PERMISOS ── */}
          <Titulo id="permisos" numero="4">Permisos</Titulo>
          <P>Los permisos justifican ausencias o llegadas tarde de los empleados. Un permiso registrado evita que el sistema cuente ese día como ausencia o tardanza en los reportes.</P>

          <Sub>Crear un permiso</Sub>
          <Paso n={1}>Presione el botón verde <strong>Crear permiso</strong>.</Paso>
          <Paso n={2}>Busque el empleado por nombre o cédula y selecciónelo de la lista.</Paso>
          <Paso n={3}>Seleccione el tipo de permiso: Cita médica, Calamidad doméstica, Permiso de elecciones, entre otros. Si no está en la lista, elija <strong>Otro</strong> y escríbalo.</Paso>
          <Paso n={4}>Seleccione la fecha del permiso.</Paso>
          <Paso n={5}>Indique la duración: día completo, medio día mañana, medio día tarde, o un rango de horas específico.</Paso>
          <Paso n={6}>Presione <strong>Guardar permiso</strong>.</Paso>

          <Sub>Editar un permiso</Sub>
          <Paso n={1}>Localice el permiso en la lista (puede buscar por nombre del empleado).</Paso>
          <Paso n={2}>Presione el ícono del lápiz junto al permiso.</Paso>
          <Paso n={3}>Modifique los datos necesarios y presione <strong>Guardar cambios</strong>.</Paso>

          <Sub>Eliminar un permiso</Sub>
          <Paso n={1}>Presione el ícono del basurero junto al permiso.</Paso>
          <Paso n={2}>Confirme la eliminación. El permiso desaparecerá y el día volverá a contarse en los cálculos de ausencia.</Paso>

          {/* ── 5. REPORTES ── */}
          <Titulo id="reportes" numero="5">Reportes</Titulo>
          <P>Muestra el detalle de todas las marcaciones del personal en el rango de fechas que usted elija. Es la sección principal para revisar el comportamiento de asistencia día a día.</P>

          <Sub>Consultar un período</Sub>
          <Paso n={1}>Seleccione la fecha de inicio en el campo <strong>Desde</strong> y la fecha final en <strong>Hasta</strong>.</Paso>
          <Paso n={2}>Los resultados aparecen agrupados por día. Cada día muestra todos los empleados que tuvieron actividad.</Paso>
          <Paso n={3}>Presione el nombre de un empleado para desplegar su detalle: horas de entrada, salida, tardanzas y horas extra de ese día.</Paso>

          <Sub>Indicadores de color</Sub>
          <div className="space-y-2 mb-4">
            {[
              ['Verde', 'Entrada a tiempo.'],
              ['Gris', 'Salida normal.'],
              ['Rojo', 'Tardanza — llegó después de su hora de entrada asignada.'],
              ['Naranja', 'Salida anticipada — salió antes de su hora de salida asignada.'],
              ['Morado', 'Horas extra — salió después de su hora de salida asignada.'],
            ].map(([color, desc]) => (
              <div key={color} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="font-bold text-gray-900 w-24 shrink-0">{color}:</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>

          <Sub>Exportar a Excel</Sub>
          <Paso n={1}>Presione el botón <strong>Excel</strong> en la parte superior de la sección.</Paso>
          <Paso n={2}>Se descargará automáticamente un archivo que puede abrir en Excel o Google Sheets con todas las marcaciones del período consultado.</Paso>

          <Sub>Exportar a PDF</Sub>
          <Paso n={1}>Presione el botón <strong>PDF</strong>.</Paso>
          <Paso n={2}>Se abrirá una nueva ventana con el reporte listo para imprimir. Use la opción de impresión de su navegador para guardarlo como PDF.</Paso>

          <Sub>Eliminar una marcación</Sub>
          <P>Si hay un registro erróneo, puede eliminarlo directamente desde el reporte.</P>
          <Paso n={1}>Expanda el detalle del empleado en el día correspondiente.</Paso>
          <Paso n={2}>Pase el cursor sobre la marcación que desea eliminar y presione el ícono del basurero que aparece.</Paso>
          <Paso n={3}>Confirme la eliminación.</Paso>
          <Advertencia>Eliminar una marcación afecta el cálculo de horas trabajadas. Hágalo solo cuando el registro sea claramente un error.</Advertencia>

          {/* ── 6. MENSUAL ── */}
          <Titulo id="mensual" numero="6">Resumen mensual</Titulo>
          <P>Tabla consolidada con el comportamiento de todo el personal durante un mes completo. Es la vista ideal para liquidar nómina.</P>
          <Sub>¿Cómo usarla?</Sub>
          <Paso n={1}>Use las flechas <strong>‹ ›</strong> para navegar entre meses.</Paso>
          <Paso n={2}>La tabla muestra para cada empleado: días trabajados, horas totales, número de tardanzas, minutos acumulados de tardanza, salidas anticipadas, horas extra, permisos y días sin marcar.</Paso>
          <Nota>Los días hábiles del mes (lunes a sábado) aparecen indicados debajo del selector de mes como referencia para comparar con los días trabajados.</Nota>

          {/* ── 7. TENDENCIAS ── */}
          <Titulo id="tendencias" numero="7">Tendencias</Titulo>
          <P>Visualización gráfica del comportamiento de asistencia. Permite identificar patrones y tomar decisiones de gestión con base en datos.</P>
          <Sub>¿Qué muestra?</Sub>
          <div className="space-y-3 mb-4">
            {[
              ['Asistencia últimos 14 días', 'Gráfica de barras con el total de empleados que marcaron cada día. Permite ver de un vistazo los días con mayor o menor presencia.'],
              ['Ranking de tardanzas del mes', 'Lista de los empleados con más llegadas tarde durante el mes en curso.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-1">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
          </div>

          {/* ── 8. CONFIGURACIÓN ── */}
          <Titulo id="config" numero="8">Configuración</Titulo>
          <P>Sección para personalizar el sistema según las necesidades de la cooperativa. Solo el personal autorizado debe hacer cambios aquí.</P>

          <Sub>Tipos de empleado</Sub>
          <P>Permite crear y editar las categorías del personal: Administrativo, Operativo, Conductor, etc. Estas categorías organizan la lista de empleados y permiten filtrar los reportes.</P>
          <Paso n={1}>Ingrese el nombre de la nueva categoría en el campo correspondiente.</Paso>
          <Paso n={2}>Presione <strong>Agregar</strong>. La categoría estará disponible de inmediato al registrar empleados.</Paso>

          <Sub>Turnos</Sub>
          <P>Los turnos permiten definir horarios diferentes según el tipo de día: lunes a viernes, sábados, domingos y festivos. Son útiles cuando un empleado tiene un horario que varía según el día de la semana.</P>
          <Paso n={1}>Cree un turno con un nombre descriptivo (por ejemplo: <em>Turno mañana operativo</em>).</Paso>
          <Paso n={2}>Defina la hora de entrada y salida para cada tipo de día.</Paso>
          <Paso n={3}>Asigne el turno al empleado desde su perfil en la sección <strong>Empleados</strong>.</Paso>
          <Nota>Si un empleado no tiene turno asignado, el sistema usa la hora de entrada y salida ingresada directamente en su perfil.</Nota>

          <Sub>Rotación mensual de turnos</Sub>
          <P>Cuando un empleado cambia de turno mes a mes, se puede registrar ese cambio para que el sistema sepa qué horario aplica en cada período.</P>
          <Paso n={1}>Seleccione el empleado y el mes.</Paso>
          <Paso n={2}>Asigne el turno que corresponde a ese mes.</Paso>
          <Paso n={3}>Guarde el cambio. El sistema aplicará automáticamente el horario correcto al calcular tardanzas.</Paso>

          <Sub>Carga masiva de turnos por Excel</Sub>
          <P>Si necesita actualizar los turnos de muchos empleados al mismo tiempo, puede hacerlo desde un archivo Excel.</P>
          <Paso n={1}>Descargue la plantilla de Excel desde el botón <strong>Descargar plantilla</strong>.</Paso>
          <Paso n={2}>Complete el archivo con el número de cédula de cada empleado y el turno que le corresponde.</Paso>
          <Paso n={3}>Suba el archivo al sistema. Se validarán todas las filas y se mostrarán los errores antes de aplicar los cambios.</Paso>
          <Advertencia>Verifique bien los números de cédula antes de subir el archivo. Un número incorrecto asignará el turno a la persona equivocada.</Advertencia>

          <Sub>Festivos colombianos</Sub>
          <P>El sistema ya incluye el calendario oficial de festivos de Colombia. En esos días, el turno de festivo aplica automáticamente para los empleados que lo tienen configurado. Puede agregar festivos locales o días especiales que no estén en el calendario oficial.</P>

          {/* ── 9. TERMINAL ── */}
          <Titulo id="terminal" numero="9">Terminal de marcación</Titulo>
          <P>El terminal es la pantalla donde los empleados registran su entrada y salida cada día. Se accede desde: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">cootransa-asistencia.vercel.app/terminal</span></P>
          <P>Esta pantalla está pensada para dejarse abierta en una tablet o computador en el punto de acceso de la cooperativa. No requiere que el empleado haga nada especial — solo pararse frente a la cámara.</P>
          <Sub>¿Cómo funciona?</Sub>
          <Paso n={1}>El empleado se ubica frente a la cámara.</Paso>
          <Paso n={2}>El sistema lo reconoce automáticamente en segundos.</Paso>
          <Paso n={3}>Detecta si corresponde a una entrada o una salida según el historial del día y registra la hora exacta.</Paso>
          <Paso n={4}>Aparece una confirmación en pantalla con el nombre del empleado y el tipo de marcación.</Paso>
          <Sub>Si el reconocimiento facial falla</Sub>
          <P>El empleado puede ingresar su <strong>PIN de 4 dígitos</strong> como respaldo. Esto ocurre automáticamente después de 3 intentos fallidos de reconocimiento.</P>
          <Nota>El terminal funciona mejor con buena iluminación y una cámara de calidad aceptable. Evite ubicarlo frente a ventanas con luz directa.</Nota>
          <Sub>Enlace rápido desde el panel</Sub>
          <P>Desde el panel de administración, en la parte inferior del menú lateral, encontrará el botón <strong>Terminal</strong> que abre el terminal de marcación en una pestaña nueva.</P>

          {/* ── 10. FAQ ── */}
          <Titulo id="faq" numero="10">Preguntas frecuentes</Titulo>
          <div className="space-y-4">
            {[
              ['¿Qué pasa si un empleado llega y el sistema no lo reconoce?', 'El sistema permite hasta 3 intentos de reconocimiento facial. Después de eso, el empleado puede ingresar su PIN de 4 dígitos para marcar normalmente. Si tampoco recuerda el PIN, el administrador puede registrar la marcación manualmente desde el historial del empleado.'],
              ['¿El sistema guarda foto de cada marcación?', 'Sí. Cada vez que un empleado marca entrada o salida, el sistema captura y guarda una foto del momento. Esto permite verificar cualquier marcación en caso de duda.'],
              ['¿Se puede registrar una marcación que el empleado olvidó hacer?', 'Sí. Desde el historial del empleado en la sección Empleados, el administrador puede agregar o corregir marcaciones manualmente.'],
              ['¿Qué pasa si se va el internet mientras el empleado está marcando?', 'La marcación no se guardará hasta que se restablezca la conexión. Por eso es importante que el punto de acceso tenga una conexión a internet estable.'],
              ['¿Puedo acceder al panel desde mi celular?', 'Sí. El panel funciona desde cualquier navegador, incluyendo el de su celular. Sin embargo, para un uso cómodo del día a día se recomienda un computador o tablet.'],
              ['¿Qué significa "días sin marcar" en el resumen mensual?', 'Son los días hábiles en los que el empleado no tiene ninguna marcación registrada y tampoco tiene un permiso para ese día. Equivale a una ausencia sin justificar.'],
              ['¿Cómo sé si una tardanza ya tiene permiso?', 'En los reportes, las marcaciones de empleados con permiso para ese día no muestran indicador de tardanza. El sistema las descuenta automáticamente al detectar el permiso registrado.'],
            ].map(([p, r]) => (
              <div key={p as string} className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">{p}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>

          {/* Pie */}
          <div className="mt-12 bg-gray-900 rounded-2xl p-6 text-center print:rounded-none">
            <p className="text-white font-bold mb-1">¿Necesita ayuda adicional?</p>
            <p className="text-gray-400 text-sm mb-4">Comuníquese con el equipo de soporte</p>
            <div className="flex items-center justify-center gap-6 flex-wrap mb-6">
              <span className="text-brand-400 text-sm font-semibold">axentiatechnologies@gmail.com</span>
              <span className="text-brand-400 text-sm font-semibold">WhatsApp: 324 686 8538</span>
            </div>
            <div className="border-t border-white/10 pt-5 flex items-center justify-center gap-2.5">
              <img src="/axentiatech-logo.jpg" alt="Axentiatech" className="w-7 h-7 rounded object-contain bg-white p-0.5" />
              <div className="text-left">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-none">Powered by</p>
                <p className="text-sm font-bold text-gray-300 leading-tight">Axentiatech</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body { font-size: 12px; }
          aside { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
