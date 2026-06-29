import { Printer, ChevronRight } from 'lucide-react'

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">{numero}</span>
        <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
      </div>
      <div className="ml-12 space-y-2">{children}</div>
    </div>
  )
}

function Linea({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <ChevronRight size={14} className="text-brand-600 mt-1 shrink-0" />
      <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
    </div>
  )
}

function Dice({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-50 border-l-4 border-brand-500 rounded-r-lg px-4 py-3 my-3">
      <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Usted dice:</p>
      <p className="text-sm text-gray-800 italic leading-relaxed">"{children}"</p>
    </div>
  )
}

function Accion({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3 my-3">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Acción en pantalla:</p>
      <p className="text-sm text-gray-800 leading-relaxed">{children}</p>
    </div>
  )
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 my-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recuerde:</p>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}

export default function GuionPresentacion() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto">

        {/* Encabezado */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8 print:rounded-none print:mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img src="/favicon.png" alt="COOTRANSA" className="w-10 h-10 rounded-full object-contain shrink-0" />
            <p className="text-white text-xs font-bold uppercase tracking-widest">Guión de presentación</p>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Reunión con el Gerente</h1>
          <p className="text-gray-400 text-sm mt-2">COOTRANSA Ltda. · Axentiatech · 2026</p>
          <button
            onClick={() => window.print()}
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition print:hidden"
          >
            <Printer size={15} /> Descargar / Imprimir PDF
          </button>
        </div>

        {/* Antes de empezar */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm font-bold text-amber-800 mb-2">Antes de la llamada — tenga listo:</p>
          <ul className="space-y-1">
            {[
              'La landing page de COOTRANSA abierta en una pestaña',
              'El panel de administración de la landing en otra pestaña',
              'El módulo de asistencia abierto en otra pestaña (con datos reales si los hay)',
              'La terminal de marcación lista para demostrar el reconocimiento facial',
              'Conexión estable y cámara funcionando',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="font-bold shrink-0">{i + 1}.</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Secciones */}
        <Seccion numero="1" titulo="Apertura — Genere confianza desde el inicio">
          <Dice>
            Gerente, buenas tardes. Gracias por su tiempo. Quiero mostrarle en concreto lo que hemos construido para COOTRANSA, para que usted mismo lo vea funcionando y me diga qué le parece.
          </Dice>
          <Linea>No lea esto textualmente — hable con naturalidad, como si fuera una conversación.</Linea>
          <Linea>El objetivo de esta parte es que el gerente se sienta cómodo y curioso, no presionado.</Linea>
        </Seccion>

        <Seccion numero="2" titulo="La landing page — La cara de COOTRANSA en internet">
          <Accion>Comparta pantalla y abra la landing page de COOTRANSA.</Accion>
          <Dice>
            Esto es la página principal de COOTRANSA en internet. Cualquier persona que busque la empresa la encuentra aquí. Tiene la información de la cooperativa, las tarifas, las rutas y un formulario para que los usuarios puedan escribirles directamente.
          </Dice>
          <Accion>Muestre el formulario de contacto y luego abra el panel de administración.</Accion>
          <Dice>
            Y aquí está el panel donde ustedes mismos pueden actualizar todo: agregan una noticia, cambian una tarifa, y aparece al instante en la página. No necesitan llamar a nadie ni esperar. También ven acá los mensajes que lleguen del formulario.
          </Dice>
          <Nota>Si el gerente hace preguntas sobre la landing, respóndalas brevemente y continúe. No se quede atascado aquí.</Nota>
        </Seccion>

        <Seccion numero="3" titulo="Módulo de asistencia — El corazón del sistema">
          <Accion>Abra el módulo de asistencia en el panel de administración.</Accion>
          <Dice>
            Ahora le muestro el sistema de control de asistencia. Esto reemplaza los relojes de huella, las planillas en papel y las hojas de Excel. Todo queda registrado automáticamente, en tiempo real, desde cualquier dispositivo.
          </Dice>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Panel de hoy</p>
          <Accion>Muestre el panel principal con las marcaciones del día.</Accion>
          <Dice>
            Acá ven en tiempo real quién entró, a qué hora, si llegó tarde o salió antes. Sin necesidad de revisar nada manualmente.
          </Dice>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Reconocimiento facial</p>
          <Accion>Abra la terminal de marcación y demuestre el reconocimiento facial en vivo.</Accion>
          <Dice>
            El empleado se acerca a la pantalla, el sistema reconoce su rostro en segundos y registra la entrada o salida automáticamente. No hay tarjetas, no hay huella, no hay papeles.
          </Dice>
          <Nota>Este es el momento de mayor impacto. Deje que el silencio hable después de la demostración.</Nota>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Reportes y resumen mensual</p>
          <Accion>Muestre la sección de reportes y luego el resumen mensual.</Accion>
          <Dice>
            Aquí tienen el historial completo de cada empleado: tardanzas, horas extra, permisos. Y este resumen mensual les muestra el total de horas trabajadas por persona en el mes, listo para que nómina lo use directamente.
          </Dice>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2">Permisos</p>
          <Accion>Abra la sección de permisos.</Accion>
          <Dice>
            Cuando un empleado tiene un permiso, calamidad o vacación, se registra acá y el sistema lo descuenta automáticamente de los indicadores. Nada se pierde ni se confunde.
          </Dice>
        </Seccion>

        <Seccion numero="4" titulo="Valor futuro — Módulo de tiquetes">
          <Dice>
            Adicionalmente, y esto es algo que podemos conversar más adelante, ya tenemos construido un módulo de venta de tiquetes en línea para las rutas de COOTRANSA. Los pasajeros comprarían su tiquete desde el celular con código QR. Pero eso lo dejamos para una próxima reunión cuando ustedes decidan.
          </Dice>
          <Nota>No profundice en esto. Menciónelo brevemente como un plus y siga.</Nota>
        </Seccion>

        <Seccion numero="5" titulo="El precio — Preséntelo con seguridad">
          <Dice>
            Gerente, todo lo que acaba de ver — la landing page, el panel de contenidos, el formulario, el sistema de asistencia biométrica completo con reportes y manual de usuario — lo estoy ofreciendo por un pago único de cinco millones de pesos, y una mensualidad de trescientos mil pesos que cubre el funcionamiento, el soporte y cualquier ajuste que necesiten.
          </Dice>
          <Nota>Diga el precio y guarde silencio. No lo justifique de inmediato. Deje que el gerente responda primero.</Nota>
          <Linea>Si dice que está caro: "Entiendo. ¿Qué parte le preocupa más?" — escuche y negocie desde ahí.</Linea>
          <Linea>Si pide rebaja: puede bajar hasta $4.000.000 de entrada, pero no ceda la mensualidad.</Linea>
          <Linea>Si pregunta qué incluye la mensualidad: "El sistema funcionando, actualizaciones, y que si algo falla yo lo resuelvo."</Linea>
        </Seccion>

        <Seccion numero="6" titulo="Cierre — Deje la pelota en su cancha">
          <Dice>
            Gerente, ¿tiene alguna pregunta sobre lo que vio? Estoy disponible para cualquier ajuste que necesiten. Si están de acuerdo, podemos dejar todo listo esta misma semana.
          </Dice>
          <Nota>No presione. Si el gerente pide tiempo para pensarlo, acuerde una fecha concreta de respuesta antes de terminar la llamada.</Nota>
        </Seccion>

        {/* Footer */}
        <div className="mt-10 bg-gray-900 rounded-2xl p-6 text-center print:rounded-none">
          <p className="text-white font-bold mb-1">¡Mucho éxito en la reunión!</p>
          <p className="text-gray-400 text-sm mb-6">Usted tiene un producto sólido — preséntelo con confianza.</p>
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
  )
}
