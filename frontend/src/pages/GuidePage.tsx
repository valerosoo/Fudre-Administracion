import {
  Wine, Users, CreditCard, Package, List, ShoppingCart, ClipboardList, FileText,
  LogIn, Eye, Info, AlertTriangle, Map,
} from 'lucide-react'

const NAV = [
  { id: 'login', label: 'Ingreso', icon: LogIn },
  { id: 'vinos', label: 'Vinos', icon: Wine },
  { id: 'miembros', label: 'Miembros', icon: Users },
  { id: 'membresias', label: 'Membresías', icon: CreditCard },
  { id: 'envios', label: 'Envíos', icon: Package },
  { id: 'precios', label: 'Lista de precios', icon: List },
  { id: 'compra', label: 'Lista de compra', icon: ShoppingCart },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'encuesta', label: 'Encuesta', icon: FileText },
  { id: 'flujo', label: 'Flujo mensual', icon: Map },
]

function SectionCard({
  id, icon: Icon, title, route, children,
}: {
  id: string
  icon: React.ElementType
  title: string
  route: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="rounded-lg border bg-card p-5 scroll-mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{route}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground/70 mt-4 mb-1.5 first:mt-0">
      {children}
    </p>
  )
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="relative pl-4 text-sm text-foreground/90">
          <span className="absolute left-0 top-[0.55em] h-1 w-1 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-2.5 rounded-lg border bg-muted/50 px-3.5 py-2.5 text-sm">
      <Info size={15} className="flex-shrink-0 mt-0.5 text-[#7F654E]" />
      <span>{children}</span>
    </div>
  )
}

export function GuidePage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Guía del panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Qué hace cada página y cómo se usan en conjunto. Los clientes que se registran en fudre.com.ar
          o completan la Encuesta entran solos como Miembros — no hace falta cargarlos a mano.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {NAV.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Icon size={12} /> {label}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        <SectionCard id="login" icon={LogIn} title="Ingreso" route="admin.fudre.com.ar/login">
          <Steps items={[
            <>Entrá con <b>email y contraseña</b> (una sola cuenta de administrador, la del club).</>,
            <>La sesión queda guardada en el navegador hasta que cierres sesión.</>,
            <>El botón rojo arriba a la derecha (ícono de salida) <b>cierra la sesión</b>.</>,
          ]} />
        </SectionCard>

        <SectionCard id="vinos" icon={Wine} title="Vinos" route="/wines">
          <p className="text-sm text-muted-foreground mb-1">
            El catálogo de vinos del club: los que se envían por membresía o se venden sueltos.
          </p>
          <Label>Qué muestra cada fila</Label>
          <Steps items={[
            <>Nombre, uva, año, foto.</>,
            <>Stock en <b>góndola</b> y en <b>cuartito</b>, y el total.</>,
            <>Precio de referencia y <b>categoría</b> — la pone el sistema solo: menos de $22.500 es "Brote", más caro es "Envero".</>,
            <>Si es <b>apto para el club</b> (entra en las membresías) y su estado de subida a la tienda online.</>,
          ]} />
          <Label>Acciones</Label>
          <Steps items={[
            <><b>+ Nuevo vino</b>: carga nombre, uva, año, stock, precio, si es apto club, y una foto.</>,
            <>Buscador por nombre, y filtros por uva / stock / categoría / estado.</>,
            <>Lápiz para editar, tacho rojo para eliminar (pide confirmación).</>,
          ]} />
        </SectionCard>

        <SectionCard id="miembros" icon={Users} title="Miembros" route="/members">
          <p className="text-sm text-muted-foreground mb-1">
            La lista de socios del club, con sus datos de contacto.
          </p>
          <Tip>
            La mayoría de los miembros <b>entran solos</b>: cuando alguien crea una cuenta en fudre.com.ar,
            o cuando completa la encuesta pública. Usá "+ Nuevo miembro" solo para altas manuales.
          </Tip>
          <Label>Acciones</Label>
          <Steps items={[
            <>Buscador por nombre.</>,
            <>Ícono de <Eye size={12} className="inline -mt-0.5" /> <b>ojo</b>: abre la ficha completa del socio (ver abajo).</>,
            <>Lápiz: edita nombre, mail, teléfono, dirección, perfil de gusto y notas internas.</>,
            <>Tacho: elimina al socio.</>,
          ]} />
          <Label>Ficha del socio (al abrir el ojo)</Label>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Steps items={[
              <>Datos de contacto y fecha de alta.</>,
              <>Su <b>membresía activa</b>, plan y cantidad de envíos confirmados.</>,
              <>Respuestas de la <b>encuesta de bienvenida</b>: estilo de vino, tipos preferidos, ocasiones, rating por cepa.</>,
            ]} />
            <Steps items={[
              <>Recomendaciones automáticas: <b>"Para vos"</b> y <b>"Nuevas experiencias"</b>, calculadas según sus gustos.</>,
              <><b>Historial de envíos</b> confirmados — cada uno se puede desplegar para ver los vinos.</>,
              <>Desde ahí mismo se puede <b>calificar con estrellas</b> cada vino que recibió.</>,
            ]} />
          </div>
        </SectionCard>

        <SectionCard id="membresias" icon={CreditCard} title="Membresías" route="/memberships">
          <p className="text-sm text-muted-foreground mb-1">
            Qué plan tiene contratado cada socio: Brote, Brote+, Envero o Envero+.
          </p>
          <Steps items={[
            <><b>+ Nueva membresía</b>: elegís el socio, el plan y la fecha de inicio.</>,
            <>Cada una tiene un estado <b>Activa / Inactiva</b> — de ahí sale a quién generarle envío el mes que viene.</>,
            <>Filtro por nombre de socio y por plan. Lápiz y tacho para editar o dar de baja.</>,
          ]} />
        </SectionCard>

        <SectionCard id="envios" icon={Package} title="Envíos" route="/shipments — tres pestañas">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['Membresías', 'Pedidos separados', 'Historial'].map(t => (
              <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border">{t}</span>
            ))}
          </div>
          <Label>Pestaña Membresías</Label>
          <Steps items={[
            <><b>"Generar propuestas de [mes]"</b>: crea sola una propuesta de envío para cada socio con membresía activa que todavía no tenga una este mes.</>,
            <>Click en una fila para ver qué vinos incluye la propuesta.</>,
            <>Con estado <b>Propuesto</b>: podés <b>Confirmar</b> (descuenta el stock de esos vinos) o <b>Cancelar</b>.</>,
            <>Confirmado o Cancelado: solo queda el tacho para eliminarlo (si estaba confirmado, restaura el stock).</>,
          ]} />
          <Label>Pestaña Pedidos Separados</Label>
          <Steps items={[
            <>Compras puntuales de un socio, fuera de su membresía. Las que vienen de la tienda online muestran su número de pedido de Tiendanube.</>,
            <><b>+ Nuevo pedido</b>: elegís socio, membresía, fecha, costo de envío y los vinos con cantidad y precio.</>,
          ]} />
          <Label>Pestaña Historial</Label>
          <Steps items={[
            <>Todos los envíos juntos (de membresía y separados), con filtro por nombre y por mes.</>,
            <>Click en una fila para desplegar el detalle de vinos de ese envío.</>,
          ]} />
        </SectionCard>

        <SectionCard id="precios" icon={List} title="Lista de precios" route="/price-list">
          <p className="text-sm text-muted-foreground mb-1">
            Ojo: esto no es el catálogo del club — es lo que cada <b>distribuidor</b> te vende, para armar compras.
          </p>
          <Steps items={[
            <><b>Importar archivo</b>: subís el PDF o Excel que te manda el distribuidor y el sistema lee los ítems solo (con IA).</>,
            <>Buscador, filtro por distribuidor y por uva, y ordenar por precio.</>,
            <>Cada fila tiene una cantidad y un botón <b>Agregar</b>: pregunta si es para la tienda, un evento o almacenamiento, y lo manda a la Lista de compra.</>,
          ]} />
        </SectionCard>

        <SectionCard id="compra" icon={ShoppingCart} title="Lista de compra" route="/purchase-list">
          <p className="text-sm text-muted-foreground mb-1">
            El "carrito" de lo que vas a comprarles a los distribuidores, agrupado por cada uno (con su teléfono y mail a mano para llamarlo).
          </p>
          <Steps items={[
            <>Botones +/− para ajustar cantidades, tacho para sacar un ítem.</>,
            <>Subtotal por distribuidor y total general al pie.</>,
            <><b>Guardar como pedido</b>: lo convierte en un Pedido formal (queda Pendiente) y te lleva directo a Pedidos.</>,
            <><b>Vaciar lista</b>: borra todo lo cargado.</>,
          ]} />
        </SectionCard>

        <SectionCard id="pedidos" icon={ClipboardList} title="Pedidos" route="/orders">
          <p className="text-sm text-muted-foreground mb-1">
            Los pedidos ya armados a distribuidores, agrupados por distribuidor.
          </p>
          <Steps items={[
            <>Filtro por estado: Todos / Pendiente / Pedido / Entregado / Cancelado.</>,
            <><b>Pendiente</b>: podés agregar más vinos, cambiar cantidades, sacar ítems, y pasar a Confirmar o Cancelar.</>,
            <><b>Pedido</b> (ya confirmado): marcás el estado de cada vino (Pedido / No pedido / Cancelado por el distribuidor) y pasás todo a <b>Marcar entregado</b> (esto suma el stock) o Cancelar.</>,
            <>Cada pedido se descarga en <b>CSV o PDF</b> desde el botón "Descargar".</>,
            <>También se puede importar un pedido ya armado con <b>Importar archivo</b> (IA).</>,
          ]} />
        </SectionCard>

        <SectionCard id="encuesta" icon={FileText} title="Encuesta" route="/survey — página pública, sin login">
          <p className="text-sm text-muted-foreground mb-1">
            Es la única página del sistema que ve el <b>socio</b>, no vos. Se la compartís por fuera (link, redes, mail).
          </p>
          <Steps items={[
            <>Pregunta estilo de vino, tipos preferidos, rating por cepa (con estrellas), ocasiones de consumo, plan de interés, frecuencia, presupuesto y nivel de conocimiento.</>,
            <>Al enviarla, <b>crea o actualiza el Miembro</b> automáticamente (buscándolo por mail) con todas esas respuestas.</>,
            <>Es una de las dos formas en que entran socios nuevos sin que vos cargues nada — la otra es el alta de cuenta en fudre.com.ar.</>,
          ]} />
        </SectionCard>

        {/* Flujo mensual */}
        <section id="flujo" className="rounded-lg p-5 text-[#FAF3EC] scroll-mt-4" style={{ background: 'var(--sidebar-bg)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C] mb-1">Cómo se usa todo junto</p>
          <h2 className="text-lg font-semibold mb-3">Flujo mensual típico</h2>
          <ol className="divide-y divide-white/10">
            {[
              <><b>Vinos</b>: mantené actualizado el stock y el precio de referencia de cada vino del club.</>,
              <><b>Envíos → Membresías</b>: cuando llega la fecha del mes, tocá "Generar propuestas" — arma solo una propuesta por cada socio activo.</>,
              <>Revisá cada propuesta y tocá <b>Confirmar</b> cuando esté lista para salir (ahí se descuenta el stock).</>,
              <>¿Falta stock de algo? Andá a <b>Lista de precios</b>, agregá lo que necesitás a la <b>Lista de compra</b>, y guardala como <b>Pedido</b>.</>,
              <>Seguí el pedido hasta <b>Entregado</b> — ese paso repone el stock automáticamente.</>,
              <>Los pedidos sueltos de la tienda online entran solos en <b>Envíos → Pedidos Separados</b>; los que sean por fuera de Tiendanube se cargan a mano ahí mismo.</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 py-2.5 text-sm text-[#E7D6D2]">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#C9A84C] text-[#3A2A0E] font-semibold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Known issue */}
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>
            <b>Pendiente de arreglo:</b> el botón "Importar archivo" (en Lista de precios y Pedidos) todavía apunta a un
            servicio viejo que solo corre en una computadora local, así que hoy no funciona desde admin.fudre.com.ar.
            El resto del panel no se ve afectado.
          </span>
        </div>
      </div>
    </div>
  )
}
