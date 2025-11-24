# CAPÍTULO 1: MODELADO DEL NEGOCIO

## 1.1 Análisis de la Organización Objetivo

### 1.1.1 Descripción de la Organización

**ProBusiness** es una empresa peruana especializada en servicios de importación y exportación, con un enfoque particular en la gestión de carga consolidada desde China hacia Perú. La organización se dedica a facilitar el proceso de importación para clientes que requieren traer productos desde el extranjero, ofreciendo servicios integrales que incluyen cotización, consolidación de carga, gestión documentaria, coordinación logística y entrega de mercancías.

La empresa opera como intermediario entre proveedores internacionales (principalmente de China) y clientes finales en Perú, gestionando todo el ciclo de vida de una importación: desde la cotización inicial hasta la entrega de la mercancía al cliente final. ProBusiness se distingue por su capacidad de consolidar múltiples pedidos de diferentes clientes en un mismo contenedor, optimizando costos y tiempos de transporte.

La organización cuenta con un sistema de gestión interna (intranet) que permite coordinar las diferentes etapas del proceso de importación, gestionar la información de clientes y productos, administrar documentación regulatoria, y facilitar la comunicación entre los diferentes actores del proceso (asesores, coordinadores, personal de China, documentación, almacén, etc.).

### 1.1.2 Misión

Proporcionar servicios integrales de importación y exportación, facilitando el acceso de empresas y personas a productos internacionales mediante la consolidación de carga, gestión documentaria eficiente y coordinación logística especializada, contribuyendo al crecimiento del comercio exterior peruano.

### 1.1.3 Visión

Ser la empresa líder en servicios de carga consolidada en Perú, reconocida por su eficiencia operativa, innovación tecnológica y compromiso con la satisfacción del cliente, expandiendo sus operaciones a nuevos mercados y fortaleciendo las relaciones comerciales entre Perú y los principales países exportadores.

---

## 1.2 Descripción del Negocio

El negocio de ProBusiness se centra en la gestión de importaciones mediante carga consolidada. El proceso principal abarca las siguientes áreas:

### 1.2.1 Gestión de Cotizaciones Iniciales
Proceso mediante el cual el asesor registra una cotización con productos por item, calcula los costos de importación (incluyendo fletes, seguros, tributos, regulaciones según tarifas por antigüedad del cliente), genera la cotización formal y envía el contrato al cliente. El cliente confirma la cotización y esta pasa al siguiente proceso.

### 1.2.2 Gestión de Coordinación y Rotulado
Proceso donde el rol de coordinación valida las cotizaciones confirmadas, envía el rotulado al número de WhatsApp del cliente mediante el sistema, y registra los datos del proveedor (número de teléfono y nombre) para cada cotización.

### 1.2.3 Gestión de Datos de China
Proceso donde el personal de China registra la cantidad de cajas que llegan al almacén y el CBM total por proveedor. El precio que cobra la empresa se calcula en función de estos datos reales y la tarifa según la antigüedad del cliente. Posteriormente, China sube la inspección (fotografías del sistema de la mercadería) que se envían automáticamente al cliente.

### 1.2.4 Gestión de Contenedores y Embarque
Proceso de consolidación de múltiples cotizaciones en contenedores, gestión del ciclo de vida del contenedor (desde su creación hasta su cierre), seguimiento de fechas de zarpe y arribo. Cuando China sube el packing list y el contenedor se cierra, las cotizaciones pasan automáticamente al estado "embarcado" y se mueven al apartado de clientes embarcados.

### 1.2.5 Gestión de Clientes Embarcados
Proceso donde se gestionan las cotizaciones que ya fueron embarcadas. En este apartado se llenan datos adicionales del proveedor como Excel de confirmación, packing list, y otros documentos del perfil del proveedor.

### 1.2.6 Gestión de Documentación
Proceso donde el perfil de documentación sube documentos adicionales requeridos para el proceso de importación (permisos, antidumping, etiquetado, documentos especiales, y documentación de embarque como lista de embarque, BL, facturas, etc.).

### 1.2.7 Gestión de Cotización Final
Proceso donde coordinación genera la plantilla final para crear la cotización final, que es una revisión de la cotización inicial pero solo con los productos que efectivamente llegaron. No todos los productos llegan, depende de la confirmación del cliente y si el proveedor envió la mercadería antes del embarque del contenedor. Una vez generadas las cotizaciones finales actualizadas, se envía el cobro al cliente.

### 1.2.8 Gestión de Entregas
Proceso de programación y ejecución de entregas de mercancías a clientes finales. Según sea provincia o Lima, se coordina la entrega por delivery o recojo en el almacén de la empresa. Incluye la gestión de horarios disponibles, registro de datos de entrega, y confirmación mediante fotografías.

### 1.2.9 Gestión de Pagos
Proceso de registro y seguimiento de pagos realizados por clientes, tanto para cotizaciones iniciales como para pagos finales. El perfil de administración valida los pagos registrados. Incluye la gestión de adelantos, pagos parciales y sobrepagos.

### 1.2.10 Base de Datos de Clientes
Proceso de mantenimiento de un histórico de clientes para determinar qué tipo de cliente es (según antigüedad y volumen de importaciones), información que se utiliza en las cotizaciones para aplicar las tarifas correspondientes.

### 1.2.11 Base de Datos de Productos
Proceso de mantenimiento de información de productos y los tipos de tributos que se pagan por cada uno, ya que aduana suele ser exigente con estos temas. Esta información se utiliza en el cálculo de costos de las cotizaciones.

### 1.2.12 Validación de Cotizaciones por Jefe de Ventas
Proceso donde el perfil de jefe de ventas valida el flujo de cotizaciones registradas por los asesores, asegurando que cumplan con los criterios establecidos antes de ser enviadas a los clientes.

---

## 1.3 Especificación de las Reglas del Negocio

| Nombre de la Regla | Descripción | Clasificación |
| :-- | :-- | :-- |
| RN01 - Validación de Cliente Registrado | Un cliente debe estar registrado en el sistema antes de poder recibir una cotización o ser asignado a un contenedor | Operación |
| RN02 - Validación de Documento de Identidad | El documento de identidad del cliente debe ser válido y único en el sistema | Integridad |
| RN03 - Cálculo de Volumen Mínimo | El volumen total de una cotización debe ser mayor a 0 CBM para ser procesada | Operación |
| RN04 - Validación de Estado de Cotización | Una cotización solo puede cambiar de estado siguiendo el flujo definido: Pendiente → Confirmada → Embarcada → En Entrega → Completada | Operación |
| RN05 - Consolidación de Contenedor | Un contenedor solo puede cerrarse cuando China ha subido el packing list y todas las cotizaciones asociadas están confirmadas | Operación |
| RN06 - Fecha de Cierre de Contenedor | Un contenedor no puede cerrarse antes de la fecha de cierre programada | Operación |
| RN07 - Validación de Documentación Completa | Un contenedor no puede cambiar a estado "En Tránsito" sin tener la documentación completa (lista de embarque, BL, factura) | Operación |
| RN08 - Registro de Pago Mínimo | Un pago registrado debe tener un monto mayor a 0 | Integridad |
| RN09 - Validación de Estado de Pago | El estado de pago se calcula automáticamente según la relación entre monto total y pagos registrados | Derivación |
| RN10 - Horarios de Entrega | Los horarios de entrega solo pueden programarse en fechas futuras y dentro del horario laboral establecido | Operación |
| RN11 - Confirmación de Entrega | Una entrega solo puede marcarse como completada cuando se ha subido evidencia fotográfica | Operación |
| RN12 - Validación de Regulaciones | Un producto debe tener todas las regulaciones aplicables registradas antes de poder ser incluido en una cotización | Operación |
| RN13 - Permisos por Rol | Los usuarios solo pueden realizar acciones según los permisos asignados a su rol | Seguridad |
| RN14 - Unicidad de Código de Producto | El código de producto debe ser único dentro del sistema | Integridad |
| RN15 - Validación de Datos de Contacto | El número de teléfono y correo electrónico del cliente deben tener formato válido | Integridad |
| RN16 - Estado de Contenedor | Un contenedor solo puede cambiar de estado siguiendo la secuencia: Pendiente → En Proceso → En Tránsito → En Almacén → Completado | Operación |
| RN17 - Asignación de Cotización a Contenedor | Una cotización solo puede asignarse a un contenedor si el contenedor está en estado "Pendiente" o "En Proceso" | Operación |
| RN18 - Cálculo Automático de Tributos | Los tributos (IGV, IPM, Percepción, Antidumping) se calculan automáticamente según la normativa vigente y la información del producto en BD | Derivación |
| RN19 - Validación de Fechas | La fecha de arribo de un contenedor no puede ser anterior a la fecha de zarpe | Integridad |
| RN20 - Gestión de Horarios Ocultos | Los horarios de entrega pueden marcarse como ocultos para no mostrarse a los clientes en el sistema público | Operación |
| RN21 - Cálculo de Tarifa por Antigüedad | La tarifa aplicada a una cotización se calcula automáticamente según la antigüedad del cliente registrada en BD de Clientes | Derivación |
| RN22 - Cálculo de Precio Final por CBM Real | El precio final de la cotización se recalcula automáticamente cuando China registra el CBM real que llegó al almacén | Derivación |
| RN23 - Validación de Rotulado | El rotulado solo puede enviarse al cliente si la cotización está confirmada y se han registrado los datos del proveedor | Operación |
| RN24 - Transición a Embarcado | Una cotización solo pasa a estado "embarcado" cuando el contenedor se cierra y China ha subido el packing list | Operación |
| RN25 - Validación de Inspección | La inspección (fotografías) solo puede subirse si China ha registrado la cantidad de cajas y CBM que llegaron al almacén | Operación |
| RN26 - Generación de Cotización Final | La cotización final solo puede generarse cuando la documentación está completa y se han registrado los productos que efectivamente llegaron | Operación |
| RN27 - Validación de Productos Llegados | Los productos incluidos en la cotización final deben ser solo aquellos que efectivamente llegaron, según confirmación del cliente y registro de China | Operación |
| RN28 - Validación de Jefe de Ventas | Una cotización solo puede enviarse al cliente si ha sido validada por el jefe de ventas | Operación |
| RN29 - Validación de Pago por Administración | Un pago solo puede confirmarse si ha sido validado por el perfil de administración | Operación |
| RN30 - Tipo de Entrega según Ubicación | Si el cliente es de provincia, la entrega se coordina por delivery. Si es de Lima, puede ser delivery o recojo en almacén | Operación |

---

## 1.4 Modelo del Negocio

### 1.4.1 Proceso: Gestión de Cotizaciones Iniciales

**Nombre:** Gestión de Cotizaciones Iniciales

**Descripción:** Este proceso gestiona la creación de cotizaciones iniciales por parte de los asesores. El asesor registra la cotización con productos por item, el sistema calcula los costos según la tarifa del cliente (basada en su antigüedad en BD), genera el contrato y lo envía al cliente. El cliente confirma la cotización y esta queda lista para el siguiente proceso.

**Objetivo:** Proporcionar cotizaciones precisas y oportunas a los clientes, calculando correctamente todos los costos asociados a la importación según la tarifa correspondiente y facilitando la toma de decisiones del cliente.

**Dueño del Proceso:** Gerente de Ventas / Jefe de Cotizaciones

**Participantes:**
- Asesor: Crea y registra las cotizaciones con productos por item
- Cliente: Recibe y confirma la cotización
- Jefe de Ventas: Valida las cotizaciones antes de enviarlas al cliente
- Sistema: Calcula automáticamente costos y tarifas

**Diagrama de Proceso:**

```
[Inicio] → [Asesor registra cotización] → [Asesor ingresa productos por item]
    ↓
[Validar cliente en BD (RN01)] → [Sistema obtiene tipo de cliente y tarifa (RN21)]
    ↓
[Validar productos en BD (RN12)] → [Sistema calcula tributos por producto (RN18)]
    ↓
[Sistema calcula costos totales] → [Jefe de Ventas valida cotización (RN28)]
    ↓
[Si validada: Generar contrato] → [Enviar contrato al cliente]
    ↓
[Cliente revisa y confirma] → [Actualizar estado a "Confirmada" (RN04)]
    ↓
[Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN01 - Validación de Cliente Registrado | Valida que el cliente esté registrado en BD de Clientes antes de crear la cotización |
| RN03 - Cálculo de Volumen Mínimo | Valida que el volumen total de la cotización sea mayor a 0 CBM antes de permitir el cálculo de costos |
| RN04 - Validación de Estado de Cotización | Controla que los cambios de estado sigan el flujo: Pendiente → Confirmada |
| RN12 - Validación de Regulaciones | Valida que los productos tengan todas las regulaciones aplicables registradas en BD de Productos |
| RN13 - Permisos por Rol | Restringe las acciones según el rol del usuario (solo asesores pueden crear, jefe de ventas puede validar) |
| RN15 - Validación de Datos de Contacto | Valida el formato de teléfono y correo electrónico del cliente durante el registro |
| RN18 - Cálculo Automático de Tributos | Calcula automáticamente IGV, IPM, Percepción y Antidumping según la información del producto en BD |
| RN21 - Cálculo de Tarifa por Antigüedad | Obtiene automáticamente la tarifa del cliente según su antigüedad registrada en BD de Clientes |
| RN28 - Validación de Jefe de Ventas | Impide enviar la cotización al cliente si no ha sido validada por el jefe de ventas |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Consulta automática de cliente en BD de Clientes para obtener tipo y tarifa
2. Consulta automática de productos en BD de Productos para obtener regulaciones y tributos
3. Cálculo automático de costos de importación según tarifa del cliente
4. Cálculo automático de tributos por producto según información en BD
5. Generación automática de contrato en formato PDF
6. Notificación automática al cliente cuando se genera la cotización
7. Actualización automática del estado de cotización cuando el cliente confirma
8. Validación automática de permisos según rol del usuario
9. Historial automático de cambios de estado de cotización

---

### 1.4.2 Proceso: Gestión de Coordinación y Rotulado

**Nombre:** Gestión de Coordinación y Rotulado

**Descripción:** Este proceso gestiona la validación de cotizaciones confirmadas por parte de coordinación, el envío de rotulado al cliente mediante WhatsApp, y el registro de datos del proveedor (número de teléfono y nombre) para cada cotización.

**Objetivo:** Validar las cotizaciones confirmadas, comunicar el rotulado al cliente de manera eficiente, y registrar la información de contacto del proveedor para facilitar la coordinación con China.

**Dueño del Proceso:** Coordinador de Operaciones

**Participantes:**
- Coordinador: Valida cotizaciones, envía rotulado, registra datos de proveedor
- Cliente: Recibe el rotulado por WhatsApp
- Sistema: Envía automáticamente el rotulado al número de WhatsApp del cliente

**Diagrama de Proceso:**

```
[Inicio] → [Cotización en estado "Confirmada"] → [Coordinador valida cotización]
    ↓
[Coordinador registra datos del proveedor] → [Teléfono y nombre del proveedor]
    ↓
[Validar datos de proveedor completos (RN23)] → [Coordinador selecciona tipo de rotulado]
    ↓
[Sistema envía rotulado por WhatsApp] → [Cliente recibe rotulado]
    ↓
[Actualizar estado de proveedor a "ROTULADO"] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN04 - Validación de Estado de Cotización | Valida que la cotización esté en estado "Confirmada" antes de proceder |
| RN13 - Permisos por Rol | Restringe las acciones al rol de Coordinación |
| RN23 - Validación de Rotulado | Impide enviar el rotulado si no se han registrado los datos del proveedor |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Validación automática de estado de cotización antes de permitir acciones
2. Envío automático de rotulado por WhatsApp al número del cliente
3. Actualización automática del estado del proveedor a "ROTULADO"
4. Notificación automática al coordinador cuando se envía el rotulado
5. Validación automática de datos del proveedor antes de permitir envío
6. Historial automático de envíos de rotulado

---

### 1.4.3 Proceso: Gestión de Datos de China

**Nombre:** Gestión de Datos de China

**Descripción:** Este proceso gestiona el registro de información real de la mercancía que llega al almacén en China. El personal de China registra la cantidad de cajas y el CBM total por proveedor. El sistema recalcula automáticamente el precio según estos datos reales y la tarifa del cliente. Posteriormente, China sube la inspección (fotografías de la mercadería) que se envían automáticamente al cliente.

**Objetivo:** Registrar información precisa de la mercancía que llega al almacén, recalcular los costos según datos reales, y proporcionar evidencia visual al cliente mediante fotografías de inspección.

**Dueño del Proceso:** Gerente de Operaciones China

**Participantes:**
- Personal de China: Registra cajas, CBM, y sube fotografías de inspección
- Sistema: Recalcula precios automáticamente según datos reales
- Cliente: Recibe las fotografías de inspección automáticamente

**Diagrama de Proceso:**

```
[Inicio] → [Mercancía llega al almacén en China] → [China registra cantidad de cajas]
    ↓
[China registra CBM total por proveedor] → [Sistema recalcula precio (RN22)]
    ↓
[Validar datos registrados] → [China sube fotografías de inspección (RN25)]
    ↓
[Sistema envía inspección al cliente] → [Cliente recibe fotografías]
    ↓
[Actualizar estado a "INSPECCIONADO"] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN13 - Permisos por Rol | Restringe las acciones a los roles de China (CatalogoChina, ContenedorAlmacen) |
| RN22 - Cálculo de Precio Final por CBM Real | Recalcula automáticamente el precio cuando se registra el CBM real que llegó al almacén |
| RN25 - Validación de Inspección | Valida que se hayan registrado cajas y CBM antes de permitir subir la inspección |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Registro de cantidad de cajas por proveedor
2. Registro de CBM total por proveedor
3. Cálculo automático de precio final según CBM real y tarifa del cliente
4. Carga de fotografías de inspección
5. Envío automático de inspección al cliente
6. Actualización automática del estado a "INSPECCIONADO"
7. Notificación automática al cliente cuando se sube la inspección
8. Historial automático de registros de China

---

### 1.4.4 Proceso: Gestión de Contenedores y Embarque

**Nombre:** Gestión de Contenedores y Embarque

**Descripción:** Este proceso gestiona la consolidación de múltiples cotizaciones en contenedores, el seguimiento del ciclo de vida del contenedor, y la transición de cotizaciones a estado "embarcado" cuando China sube el packing list y el contenedor se cierra.

**Objetivo:** Optimizar la consolidación de carga, garantizar el seguimiento oportuno del contenedor, y asegurar que las cotizaciones pasen correctamente a estado embarcado cuando se cierra el contenedor.

**Dueño del Proceso:** Gerente de Operaciones / Coordinador de Contenedores

**Participantes:**
- Coordinador de Contenedores: Crea y gestiona contenedores, consolida cotizaciones
- Personal de China: Sube el packing list cuando el contenedor está listo
- Sistema: Transiciona automáticamente cotizaciones a estado "embarcado"

**Diagrama de Proceso:**

```
[Inicio] → [Coordinador crea contenedor] → [Asignar cotizaciones confirmadas (RN17)]
    ↓
[Coordinador programa fecha de cierre] → [Validar fecha de cierre (RN06)]
    ↓
[Esperar fecha de cierre] → [China sube packing list]
    ↓
[Validar packing list subido (RN05)] → [Cerrar contenedor]
    ↓
[Sistema transiciona cotizaciones a "embarcado" (RN24)] → [Cotizaciones pasan a apartado de clientes]
    ↓
[Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN05 - Consolidación de Contenedor | Valida que China haya subido el packing list antes de permitir cerrar el contenedor |
| RN06 - Fecha de Cierre de Contenedor | Impide cerrar el contenedor antes de la fecha programada |
| RN16 - Estado de Contenedor | Controla que los cambios de estado sigan la secuencia: Pendiente → En Proceso → Cerrado |
| RN17 - Asignación de Cotización a Contenedor | Solo permite asignar cotizaciones confirmadas a contenedores en estados "Pendiente" o "En Proceso" |
| RN24 - Transición a Embarcado | Transiciona automáticamente las cotizaciones a estado "embarcado" cuando el contenedor se cierra |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Creación automática de contenedor con asignación de cotizaciones confirmadas
2. Validación automática de packing list antes de cerrar contenedor
3. Validación automática de fecha de cierre programada
4. Transición automática de cotizaciones a estado "embarcado" cuando se cierra contenedor
5. Movimiento automático de cotizaciones al apartado de clientes embarcados
6. Notificación automática a participantes cuando se cierra el contenedor
7. Generación automática de reportes de contenedor
8. Historial automático de cambios de estado del contenedor

---

### 1.4.5 Proceso: Gestión de Clientes Embarcados

**Nombre:** Gestión de Clientes Embarcados

**Descripción:** Este proceso gestiona las cotizaciones que ya fueron embarcadas. En este apartado se llenan datos adicionales del proveedor como Excel de confirmación, packing list, y otros documentos del perfil del proveedor.

**Objetivo:** Completar la información del proveedor y documentación relacionada para las cotizaciones que ya fueron embarcadas, facilitando el proceso de documentación y cotización final.

**Dueño del Proceso:** Coordinador de Operaciones

**Participantes:**
- Coordinador: Completa datos adicionales del proveedor
- Sistema: Almacena y organiza la documentación del proveedor

**Diagrama de Proceso:**

```
[Inicio] → [Cotización en estado "embarcado"] → [Coordinador accede a perfil del proveedor]
    ↓
[Coordinador sube Excel de confirmación] → [Coordinador sube packing list]
    ↓
[Coordinador sube otros documentos del proveedor] → [Sistema almacena documentos]
    ↓
[Actualizar estado de proveedor] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN04 - Validación de Estado de Cotización | Valida que la cotización esté en estado "embarcado" |
| RN13 - Permisos por Rol | Restringe las acciones al rol de Coordinación |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Carga de Excel de confirmación del proveedor
2. Carga de packing list del proveedor
3. Carga de otros documentos del perfil del proveedor
4. Almacenamiento automático de documentos en el sistema
5. Organización automática de documentos por proveedor
6. Historial automático de documentos cargados

---

### 1.4.6 Proceso: Gestión de Documentación

**Nombre:** Gestión de Documentación

**Descripción:** Este proceso gestiona la carga de documentación adicional requerida para el proceso de importación. El perfil de documentación sube documentos como permisos, antidumping, etiquetado, documentos especiales, y documentación de embarque (lista de embarque, BL, facturas, etc.).

**Objetivo:** Asegurar que toda la documentación requerida para el proceso de importación esté completa y disponible antes de generar la cotización final.

**Dueño del Proceso:** Gerente de Documentación

**Participantes:**
- Personal de Documentación: Sube y gestiona documentos
- Sistema: Organiza y almacena la documentación

**Diagrama de Proceso:**

```
[Inicio] → [Contenedor cerrado] → [Documentación accede a carpeta del contenedor]
    ↓
[Documentación sube lista de embarque] → [Documentación sube BL]
    ↓
[Documentación sube facturas] → [Documentación sube otros documentos requeridos]
    ↓
[Validar documentación completa (RN07)] → [Si completa: Marcar como lista]
    ↓
[Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN07 - Validación de Documentación Completa | Valida que estén todos los documentos requeridos antes de permitir generar cotización final |
| RN13 - Permisos por Rol | Restringe las acciones al rol de Documentación |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Carga de lista de embarque
2. Carga de BL (Bill of Lading)
3. Carga de facturas
4. Carga de otros documentos requeridos
5. Validación automática de documentación completa
6. Organización automática de documentos por contenedor
7. Notificación automática cuando la documentación está completa
8. Historial automático de documentos cargados

---

### 1.4.7 Proceso: Gestión de Cotización Final

**Nombre:** Gestión de Cotización Final

**Descripción:** Este proceso gestiona la generación de la cotización final, que es una revisión de la cotización inicial pero solo con los productos que efectivamente llegaron. Coordinación genera la plantilla final, el sistema crea la cotización final actualizada con los productos confirmados, y se envía el cobro al cliente.

**Objetivo:** Generar cotizaciones finales precisas basadas en los productos que efectivamente llegaron, y facilitar el proceso de cobro al cliente.

**Dueño del Proceso:** Coordinador de Operaciones

**Participantes:**
- Coordinador: Genera la plantilla final y revisa la cotización final
- Sistema: Crea automáticamente la cotización final con productos que llegaron
- Cliente: Recibe la cotización final y el cobro

**Diagrama de Proceso:**

```
[Inicio] → [Documentación completa (RN07)] → [Coordinación genera plantilla final]
    ↓
[Validar productos que llegaron (RN27)] → [Sistema crea cotización final con productos confirmados]
    ↓
[Sistema recalcula costos según productos reales] → [Coordinador revisa cotización final]
    ↓
[Generar documento de cotización final] → [Enviar cotización final y cobro al cliente]
    ↓
[Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN07 - Validación de Documentación Completa | Valida que la documentación esté completa antes de generar cotización final |
| RN13 - Permisos por Rol | Restringe las acciones al rol de Coordinación |
| RN26 - Generación de Cotización Final | Solo permite generar cotización final cuando documentación está completa y productos registrados |
| RN27 - Validación de Productos Llegados | Solo incluye en la cotización final los productos que efectivamente llegaron según confirmación y registro de China |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Generación automática de plantilla final por coordinación
2. Filtrado automático de productos que llegaron vs productos que no llegaron
3. Cálculo automático de costos según productos reales
4. Generación automática de documento de cotización final en PDF
5. Envío automático de cotización final y cobro al cliente
6. Notificación automática al cliente cuando se genera la cotización final
7. Historial automático de cotizaciones finales generadas

---

### 1.4.8 Proceso: Gestión de Entregas

**Nombre:** Gestión de Entregas

**Descripción:** Este proceso gestiona la programación y ejecución de entregas de mercancías a clientes finales. Según sea provincia o Lima, se coordina la entrega por delivery o recojo en el almacén de la empresa. Incluye la gestión de horarios disponibles, registro de datos de entrega, y confirmación mediante fotografías.

**Objetivo:** Garantizar entregas oportunas y eficientes a los clientes, con registro completo de la información de entrega y confirmación mediante evidencia documental, adaptándose al tipo de entrega según la ubicación del cliente.

**Dueño del Proceso:** Gerente de Logística / Coordinador de Entregas

**Participantes:**
- Coordinador de Entregas: Programa y gestiona las entregas
- Cliente: Proporciona datos de entrega y confirma recepción
- Personal de Entrega: Ejecuta la entrega física (para delivery)
- Almacén: Prepara la mercancía para entrega o recojo

**Diagrama de Proceso:**

```
[Inicio] → [Contenedor en estado "En Almacén"] → [Determinar tipo de entrega (RN30)]
    ↓
[Si provincia: Coordinar delivery] → [Si Lima: Coordinar delivery o recojo en almacén]
    ↓
[Coordinador configura horarios disponibles] → [Validar horarios futuros (RN10)]
    ↓
[Cliente selecciona horario] → [Cliente registra datos de entrega]
    ↓
[Validar datos de contacto (RN15)] → [Coordinador confirma programación]
    ↓
[Personal de entrega ejecuta entrega / Cliente recoge en almacén] → [Registrar evidencia fotográfica]
    ↓
[Validar evidencia subida (RN11)] → [Marcar entrega como completada]
    ↓
[Actualizar estado de cotización] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN10 - Horarios de Entrega | Valida que los horarios programados sean en fechas futuras y dentro del horario laboral |
| RN11 - Confirmación de Entrega | Impide marcar una entrega como completada sin haber subido evidencia fotográfica |
| RN15 - Validación de Datos de Contacto | Valida el formato de teléfono y dirección proporcionados por el cliente |
| RN20 - Gestión de Horarios Ocultos | Permite ocultar ciertos horarios para que no se muestren a los clientes |
| RN30 - Tipo de Entrega según Ubicación | Determina automáticamente si la entrega es por delivery (provincia) o puede ser delivery o recojo (Lima) |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Determinación automática del tipo de entrega según ubicación del cliente
2. Configuración automática de horarios disponibles por fecha
3. Validación automática de horarios (solo fechas futuras, horario laboral)
4. Ocultamiento automático de horarios marcados como ocultos
5. Notificación automática al cliente cuando se programa su entrega
6. Validación automática de datos de contacto antes de confirmar programación
7. Validación automática de evidencia fotográfica antes de completar entrega
8. Actualización automática del estado de entrega según acciones realizadas
9. Generación automática de comprobante de entrega
10. Historial automático de cambios en programación de entregas

---

### 1.4.9 Proceso: Gestión de Pagos

**Nombre:** Gestión de Pagos

**Descripción:** Este proceso gestiona el registro, validación y seguimiento de pagos realizados por clientes, tanto para cotizaciones iniciales como para pagos finales. El perfil de administración valida los pagos registrados. Incluye la gestión de adelantos, pagos parciales y sobrepagos.

**Objetivo:** Mantener un control preciso de los pagos realizados por los clientes, facilitando la gestión financiera y el seguimiento de cuentas por cobrar, con validación adecuada por parte de administración.

**Dueño del Proceso:** Gerente Financiero / Administrador de Pagos

**Participantes:**
- Administrador de Pagos: Registra y gestiona los pagos
- Administración: Valida los pagos registrados
- Cliente: Realiza los pagos
- Coordinador: Puede consultar el estado de pagos de sus cotizaciones

**Diagrama de Proceso:**

```
[Inicio] → [Cliente realiza pago] → [Administrador registra pago]
    ↓
[Validar monto > 0 (RN08)] → [Registrar pago en sistema]
    ↓
[Administración valida pago (RN29)] → [Si validado: Confirmar pago]
    ↓
[Sistema calcula estado de pago (RN09)] → [Actualizar estado: Pendiente/Adelanto/Pagado/Sobrepago]
    ↓
[Notificar actualización] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN08 - Registro de Pago Mínimo | Valida que el monto del pago sea mayor a 0 antes de registrarlo |
| RN09 - Validación de Estado de Pago | Calcula automáticamente el estado según: si pagos > total = Sobrepago, si pagos = total = Pagado, si 0 < pagos < total = Adelanto, si pagos = 0 = Pendiente |
| RN13 - Permisos por Rol | Restringe las acciones según el rol del usuario |
| RN29 - Validación de Pago por Administración | Impide confirmar un pago si no ha sido validado por el perfil de administración |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Validación automática de monto de pago (debe ser > 0)
2. Cálculo automático del estado de pago según relación entre total y pagos
3. Validación automática de pago por administración
4. Actualización automática del estado de cotización según estado de pago
5. Generación automática de comprobante de pago
6. Notificación automática al cliente cuando se registra un pago
7. Historial automático de todos los pagos registrados
8. Cálculo automático de saldo pendiente
9. Validación automática de duplicidad de pagos

---

### 1.4.10 Proceso: Base de Datos de Clientes

**Nombre:** Base de Datos de Clientes

**Descripción:** Este proceso gestiona el mantenimiento de un histórico de clientes para determinar qué tipo de cliente es según su antigüedad y volumen de importaciones. Esta información se utiliza en las cotizaciones para aplicar las tarifas correspondientes.

**Objetivo:** Mantener información actualizada y completa del historial de clientes, facilitando la determinación automática del tipo de cliente y la tarifa correspondiente en las cotizaciones.

**Dueño del Proceso:** Administrador del Sistema

**Participantes:**
- Administrador: Gestiona la información de clientes
- Sistema: Utiliza la información para determinar tipo de cliente y tarifa en cotizaciones

**Diagrama de Proceso:**

```
[Inicio] → [Administrador accede a BD de Clientes] → [Consultar/Editar información de cliente]
    ↓
[Registrar historial de importaciones] → [Sistema calcula antigüedad y volumen]
    ↓
[Sistema determina tipo de cliente] → [Sistema asigna tarifa correspondiente]
    ↓
[Guardar información] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN02 - Validación de Documento de Identidad | Valida que el documento de identidad sea único en el sistema |
| RN13 - Permisos por Rol | Restringe las acciones según el rol del usuario |
| RN15 - Validación de Datos de Contacto | Valida formato de teléfono y correo electrónico |
| RN21 - Cálculo de Tarifa por Antigüedad | Utiliza la información de BD para determinar la tarifa del cliente |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Registro de información de clientes
2. Registro de historial de importaciones por cliente
3. Cálculo automático de antigüedad del cliente
4. Cálculo automático de volumen total importado por cliente
5. Determinación automática del tipo de cliente según antigüedad y volumen
6. Asignación automática de tarifa según tipo de cliente
7. Consulta automática de información de cliente en cotizaciones
8. Historial automático de cambios en información de clientes

---

### 1.4.11 Proceso: Base de Datos de Productos

**Nombre:** Base de Datos de Productos

**Descripción:** Este proceso gestiona el mantenimiento de información de productos y los tipos de tributos que se pagan por cada uno, ya que aduana suele ser exigente con estos temas. Esta información se utiliza en el cálculo de costos de las cotizaciones.

**Objetivo:** Mantener información actualizada y completa de productos y sus tributos aplicables, facilitando el cálculo preciso de costos en las cotizaciones.

**Dueño del Proceso:** Administrador del Sistema

**Participantes:**
- Administrador: Gestiona la información de productos y tributos
- Sistema: Utiliza la información para calcular tributos en cotizaciones

**Diagrama de Proceso:**

```
[Inicio] → [Administrador accede a BD de Productos] → [Consultar/Editar información de producto]
    ↓
[Registrar código de producto] → [Validar unicidad (RN14)]
    ↓
[Registrar tributos aplicables] → [Registrar regulaciones (RN12)]
    ↓
[Guardar información] → [Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN12 - Validación de Regulaciones | Registra las regulaciones aplicables a cada producto |
| RN13 - Permisos por Rol | Restringe las acciones según el rol del usuario |
| RN14 - Unicidad de Código de Producto | Valida que el código de producto sea único |
| RN18 - Cálculo Automático de Tributos | Utiliza la información de BD para calcular tributos en cotizaciones |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Registro de información de productos
2. Registro de código único de producto
3. Registro de tributos aplicables por producto
4. Registro de regulaciones aplicables por producto
5. Validación automática de unicidad de código
6. Consulta automática de información de producto en cotizaciones
7. Cálculo automático de tributos según información del producto
8. Historial automático de cambios en información de productos

---

### 1.4.12 Proceso: Validación de Cotizaciones por Jefe de Ventas

**Nombre:** Validación de Cotizaciones por Jefe de Ventas

**Descripción:** Este proceso gestiona la validación del flujo de cotizaciones registradas por los asesores. El jefe de ventas revisa y valida las cotizaciones antes de que sean enviadas a los clientes, asegurando que cumplan con los criterios establecidos.

**Objetivo:** Asegurar que todas las cotizaciones cumplan con los estándares de calidad y criterios establecidos antes de ser enviadas a los clientes.

**Dueño del Proceso:** Jefe de Ventas

**Participantes:**
- Jefe de Ventas: Revisa y valida las cotizaciones
- Asesor: Crea las cotizaciones que serán validadas
- Sistema: Notifica y actualiza el estado según la validación

**Diagrama de Proceso:**

```
[Inicio] → [Asesor crea cotización] → [Cotización en estado "Pendiente Validación"]
    ↓
[Jefe de Ventas revisa cotización] → [Validar criterios establecidos]
    ↓
[Si cumple: Aprobar (RN28)] → [Si no cumple: Rechazar con observaciones]
    ↓
[Actualizar estado de cotización] → [Notificar al asesor]
    ↓
[Fin]
```

**Reglas de Negocio que Aplican en el Proceso:**

| Regla | Aplicación en el Proceso |
| :-- | :-- |
| RN13 - Permisos por Rol | Restringe las acciones al rol de Jefe de Ventas |
| RN28 - Validación de Jefe de Ventas | Impide enviar la cotización al cliente si no ha sido validada por el jefe de ventas |

**Requerimientos del Negocio (Actividades a Automatizar):**

1. Notificación automática al jefe de ventas cuando hay cotizaciones pendientes
2. Validación automática de permisos antes de permitir validar
3. Actualización automática del estado de cotización según validación
4. Notificación automática al asesor cuando se valida o rechaza la cotización
5. Historial automático de validaciones realizadas
6. Registro automático de observaciones en caso de rechazo

---

## 1.5 Matrices de Trazabilidad

### 1.5.1 Reglas del Negocio vs Procesos

| Regla | Cotizaciones Iniciales | Coordinación y Rotulado | Datos de China | Contenedores y Embarque | Clientes Embarcados | Documentación | Cotización Final | Entregas | Pagos | BD Clientes | BD Productos | Validación Jefe Ventas |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| RN01 - Validación de Cliente Registrado | X | | | | | | | | | X | | |
| RN02 - Validación de Documento de Identidad | | | | | | | | | | X | | |
| RN03 - Cálculo de Volumen Mínimo | X | | | | | | | | | | | |
| RN04 - Validación de Estado de Cotización | X | X | | X | X | | X | | | | | |
| RN05 - Consolidación de Contenedor | | | | X | | | | | | | | |
| RN06 - Fecha de Cierre de Contenedor | | | | X | | | | | | | | |
| RN07 - Validación de Documentación Completa | | | | | | X | X | | | | | |
| RN08 - Registro de Pago Mínimo | | | | | | | | | X | | | |
| RN09 - Validación de Estado de Pago | | | | | | | | | X | | | |
| RN10 - Horarios de Entrega | | | | | | | | X | | | | |
| RN11 - Confirmación de Entrega | | | | | | | | X | | | | |
| RN12 - Validación de Regulaciones | X | | | | | | | | | | X | |
| RN13 - Permisos por Rol | X | X | X | X | X | X | X | X | X | X | X | X |
| RN14 - Unicidad de Código de Producto | | | | | | | | | | | X | |
| RN15 - Validación de Datos de Contacto | X | | | | | | | X | | X | | |
| RN16 - Estado de Contenedor | | | | X | | | | | | | | |
| RN17 - Asignación de Cotización a Contenedor | | | | X | | | | | | | | |
| RN18 - Cálculo Automático de Tributos | X | | | | | | X | | | | X | |
| RN19 - Validación de Fechas | | | | X | | | | | | | | |
| RN20 - Gestión de Horarios Ocultos | | | | | | | | X | | | | |
| RN21 - Cálculo de Tarifa por Antigüedad | X | | | | | | X | | | X | | |
| RN22 - Cálculo de Precio Final por CBM Real | | | X | | | | X | | | | | |
| RN23 - Validación de Rotulado | | X | | | | | | | | | | |
| RN24 - Transición a Embarcado | | | | X | | | | | | | | |
| RN25 - Validación de Inspección | | | X | | | | | | | | | |
| RN26 - Generación de Cotización Final | | | | | | | X | | | | | |
| RN27 - Validación de Productos Llegados | | | | | | | X | | | | | |
| RN28 - Validación de Jefe de Ventas | X | | | | | | | | | | | X |
| RN29 - Validación de Pago por Administración | | | | | | | | | X | | | |
| RN30 - Tipo de Entrega según Ubicación | | | | | | | | X | | | | |

### 1.5.2 Participantes vs Procesos

| Participante | Cotizaciones Iniciales | Coordinación y Rotulado | Datos de China | Contenedores y Embarque | Clientes Embarcados | Documentación | Cotización Final | Entregas | Pagos | BD Clientes | BD Productos | Validación Jefe Ventas |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Asesor | X | | | | | | | | | | | |
| Cliente | X | X | X | | | | X | X | | | | |
| Jefe de Ventas | X | | | | | | | | | | | X |
| Coordinador | | X | | X | X | | X | X | | | | |
| Personal de China | | | X | X | | | | | | | | |
| Documentación | | | | | | X | | | | | | |
| Almacén | | | | | | | | X | | | | |
| Personal de Entrega | | | | | | | | X | | | | |
| Administrador de Pagos | | | | | | | | | X | | | |
| Administración | | | | | | | | | X | | | |
| Administrador Sistema | | | | | | | | | | X | X | |

### 1.5.3 Objetos de Datos vs Procesos

| Objeto de Datos | Cotizaciones Iniciales | Coordinación y Rotulado | Datos de China | Contenedores y Embarque | Clientes Embarcados | Documentación | Cotización Final | Entregas | Pagos | BD Clientes | BD Productos | Validación Jefe Ventas |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Cliente | X | X | | | | | X | X | X | X | | |
| Cotización | X | X | | X | X | | X | | X | | | |
| Contenedor | | | | X | | | | | | | | |
| Producto | X | | | | | | X | | | | X | |
| Pago | | | | | | | | | X | | | |
| Documentación | | | | | | X | X | | | | | |
| Horario de Entrega | | | | | | | | X | | | | |
| Regulación | X | | | | | | | | | | X | |
| Proveedor | X | X | X | X | X | | X | | | | | |
| Rotulado | | X | | | | | | | | | | |
| Inspección | | | X | | | | | | | | | |
| Packing List | | | | X | X | | | | | | | |
| Cotización Final | | | | | | | X | | | | | |
| Usuario | X | X | X | X | X | X | X | X | X | X | X | X |

---

## 1.6 Requerimientos del Negocio: Resumen por Proceso

### Proceso: Gestión de Cotizaciones Iniciales
1. Consulta automática de cliente en BD de Clientes para obtener tipo y tarifa
2. Consulta automática de productos en BD de Productos para obtener regulaciones y tributos
3. Cálculo automático de costos de importación según tarifa del cliente
4. Cálculo automático de tributos por producto según información en BD
5. Generación automática de contrato en formato PDF
6. Notificación automática al cliente cuando se genera la cotización
7. Actualización automática del estado de cotización cuando el cliente confirma
8. Validación automática de permisos según rol del usuario
9. Historial automático de cambios de estado de cotización

### Proceso: Gestión de Coordinación y Rotulado
1. Validación automática de estado de cotización antes de permitir acciones
2. Envío automático de rotulado por WhatsApp al número del cliente
3. Actualización automática del estado del proveedor a "ROTULADO"
4. Notificación automática al coordinador cuando se envía el rotulado
5. Validación automática de datos del proveedor antes de permitir envío
6. Historial automático de envíos de rotulado

### Proceso: Gestión de Datos de China
1. Registro de cantidad de cajas por proveedor
2. Registro de CBM total por proveedor
3. Cálculo automático de precio final según CBM real y tarifa del cliente
4. Carga de fotografías de inspección
5. Envío automático de inspección al cliente
6. Actualización automática del estado a "INSPECCIONADO"
7. Notificación automática al cliente cuando se sube la inspección
8. Historial automático de registros de China

### Proceso: Gestión de Contenedores y Embarque
1. Creación automática de contenedor con asignación de cotizaciones confirmadas
2. Validación automática de packing list antes de cerrar contenedor
3. Validación automática de fecha de cierre programada
4. Transición automática de cotizaciones a estado "embarcado" cuando se cierra contenedor
5. Movimiento automático de cotizaciones al apartado de clientes embarcados
6. Notificación automática a participantes cuando se cierra el contenedor
7. Generación automática de reportes de contenedor
8. Historial automático de cambios de estado del contenedor

### Proceso: Gestión de Clientes Embarcados
1. Carga de Excel de confirmación del proveedor
2. Carga de packing list del proveedor
3. Carga de otros documentos del perfil del proveedor
4. Almacenamiento automático de documentos en el sistema
5. Organización automática de documentos por proveedor
6. Historial automático de documentos cargados

### Proceso: Gestión de Documentación
1. Carga de lista de embarque
2. Carga de BL (Bill of Lading)
3. Carga de facturas
4. Carga de otros documentos requeridos
5. Validación automática de documentación completa
6. Organización automática de documentos por contenedor
7. Notificación automática cuando la documentación está completa
8. Historial automático de documentos cargados

### Proceso: Gestión de Cotización Final
1. Generación automática de plantilla final por coordinación
2. Filtrado automático de productos que llegaron vs productos que no llegaron
3. Cálculo automático de costos según productos reales
4. Generación automática de documento de cotización final en PDF
5. Envío automático de cotización final y cobro al cliente
6. Notificación automática al cliente cuando se genera la cotización final
7. Historial automático de cotizaciones finales generadas

### Proceso: Gestión de Entregas
1. Determinación automática del tipo de entrega según ubicación del cliente
2. Configuración automática de horarios disponibles por fecha
3. Validación automática de horarios (solo fechas futuras, horario laboral)
4. Ocultamiento automático de horarios marcados como ocultos
5. Notificación automática al cliente cuando se programa su entrega
6. Validación automática de datos de contacto antes de confirmar programación
7. Validación automática de evidencia fotográfica antes de completar entrega
8. Actualización automática del estado de entrega según acciones realizadas
9. Generación automática de comprobante de entrega
10. Historial automático de cambios en programación de entregas

### Proceso: Gestión de Pagos
1. Validación automática de monto de pago (debe ser > 0)
2. Cálculo automático del estado de pago según relación entre total y pagos
3. Validación automática de pago por administración
4. Actualización automática del estado de cotización según estado de pago
5. Generación automática de comprobante de pago
6. Notificación automática al cliente cuando se registra un pago
7. Historial automático de todos los pagos registrados
8. Cálculo automático de saldo pendiente
9. Validación automática de duplicidad de pagos

### Proceso: Base de Datos de Clientes
1. Registro de información de clientes
2. Registro de historial de importaciones por cliente
3. Cálculo automático de antigüedad del cliente
4. Cálculo automático de volumen total importado por cliente
5. Determinación automática del tipo de cliente según antigüedad y volumen
6. Asignación automática de tarifa según tipo de cliente
7. Consulta automática de información de cliente en cotizaciones
8. Historial automático de cambios en información de clientes

### Proceso: Base de Datos de Productos
1. Registro de información de productos
2. Registro de código único de producto
3. Registro de tributos aplicables por producto
4. Registro de regulaciones aplicables por producto
5. Validación automática de unicidad de código
6. Consulta automática de información de producto en cotizaciones
7. Cálculo automático de tributos según información del producto
8. Historial automático de cambios en información de productos

### Proceso: Validación de Cotizaciones por Jefe de Ventas
1. Notificación automática al jefe de ventas cuando hay cotizaciones pendientes
2. Validación automática de permisos antes de permitir validar
3. Actualización automática del estado de cotización según validación
4. Notificación automática al asesor cuando se valida o rechaza la cotización
5. Historial automático de validaciones realizadas
6. Registro automático de observaciones en caso de rechazo

---
