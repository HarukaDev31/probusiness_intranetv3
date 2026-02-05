# Calendar Activities API - Especificación de Endpoints

## Índice
1. [Endpoints de Actividades](#1-endpoints-de-actividades)
2. [Endpoints de Catálogo de Actividades](#2-endpoints-de-catálogo-de-actividades)
3. [Endpoints de Estado y Prioridad](#3-endpoints-de-estado-y-prioridad)
4. [Endpoints de Notas](#4-endpoints-de-notas)
5. [Endpoints de Responsables](#5-endpoints-de-responsables)
6. [Endpoints de Colores](#6-endpoints-de-colores)
7. [Endpoints de Contenedores](#7-endpoints-de-contenedores)
8. [Endpoints de Progreso](#8-endpoints-de-progreso)
9. [Endpoints de Tracking / Historial](#9-endpoints-de-tracking--historial)
10. [Permisos por Rol](#10-permisos-por-rol)

---

## 1. Endpoints de Actividades

### GET `/api/calendar/events`
Obtiene lista de actividades/eventos con filtros opcionales.

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | No | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | No | Fecha fin (YYYY-MM-DD) |
| `responsable_id` | number | No | Filtrar por ID de responsable |
| `contenedor_id` | number | No | Filtrar por ID de consolidado |
| `contenedor_ids[]` | number[] | No | Varios consolidados (vista progreso) |
| `status` | string | No | PENDIENTE, PROGRESO, COMPLETADO |
| `priority` | number | No | 0 (Bajo), 1 (Medio), 2 (Alto) |
| `page` | number | No | Página (para paginación; usar con `per_page`) |
| `per_page` | number | No | Registros por página (ej. 10, 25, 50) |

**Paginación:** Si se envían `page` y `per_page`, el backend debe devolver en la respuesta un objeto `meta` con: `current_page`, `last_page`, `per_page`, `total`. Si no se envían, se devuelve la lista completa (sin `meta`).

**Response (200) con paginación (cuando se envían page y per_page):**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 48
  }
}
```

**Response (200) sin paginación:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_id": 5,
      "priority": 1,
      "name": "Revisar documentación contenedor ABC",
      "contenedor_id": 10,
      "notes": "Notas generales de la actividad",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z",
      "deleted_at": null,
      "days": [
        {
          "id": 1,
          "calendar_id": 5,
          "calendar_event_id": 1,
          "date": "2026-02-01"
        },
        {
          "id": 2,
          "calendar_id": 5,
          "calendar_event_id": 1,
          "date": "2026-02-02"
        }
      ],
      "charges": [
        {
          "id": 1,
          "calendar_id": 5,
          "user_id": 12,
          "calendar_event_id": 1,
          "notes": "Nota del responsable",
          "assigned_at": "2026-02-01T10:00:00Z",
          "removed_at": null,
          "status": "PROGRESO",
          "user": {
            "id": 12,
            "nombre": "Danitza",
            "email": "danitza@probusiness.com",
            "avatar": null,
            "color": "#8B5CF6"
          }
        }
      ],
      "contenedor": {
        "id": 10,
        "nombre": "Consolidado ABC",
        "codigo": "CONT-2026-001"
      },
      "start_date": "2026-02-01",
      "end_date": "2026-02-02",
      "duration": 2
    }
  ],
  "message": "Actividades obtenidas correctamente"
}
```

---

### GET `/api/calendar/events/{id}`
Obtiene una actividad específica por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "calendar_id": 5,
    "priority": 1,
    "name": "Revisar documentación contenedor ABC",
    "contenedor_id": 10,
    "notes": "Notas generales",
    "days": [...],
    "charges": [...],
    "contenedor": {...}
  }
}
```

---

### POST `/api/calendar/activities`
Crea una nueva actividad.

**Request Body:**
```json
{
  "name": "Nueva actividad",
  "priority": 1,
  "contenedor_id": 10,
  "notes": "Notas opcionales",
  "start_date": "2026-02-05",
  "end_date": "2026-02-07",
  "responsable_ids": [12, 15]
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la actividad |
| `priority` | number | No | 0, 1 o 2 (default: 0) |
| `contenedor_id` | number | No | ID del consolidado |
| `notes` | string | No | Notas generales |
| `start_date` | string | Sí | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha fin (YYYY-MM-DD) |
| `responsable_ids` | number[] | No | Array de 1-2 user_ids |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "calendar_id": 5,
    "priority": 1,
    "name": "Nueva actividad",
    "contenedor_id": 10,
    "notes": "Notas opcionales",
    "days": [
      { "id": 50, "date": "2026-02-05" },
      { "id": 51, "date": "2026-02-06" },
      { "id": 52, "date": "2026-02-07" }
    ],
    "charges": [
      {
        "id": 30,
        "user_id": 12,
        "status": "PENDIENTE",
        "user": { "id": 12, "nombre": "Danitza", "color": "#8B5CF6" }
      },
      {
        "id": 31,
        "user_id": 15,
        "status": "PENDIENTE",
        "user": { "id": 15, "nombre": "Patrick", "color": "#3B82F6" }
      }
    ],
    "contenedor": { "id": 10, "nombre": "Consolidado ABC" },
    "start_date": "2026-02-05",
    "end_date": "2026-02-07"
  },
  "message": "Actividad creada correctamente"
}
```

---

### PUT `/api/calendar/activities/{id}`
Actualiza una actividad existente.

**Request Body:**
```json
{
  "name": "Actividad actualizada",
  "priority": 2,
  "contenedor_id": 15,
  "notes": "Nuevas notas",
  "start_date": "2026-02-06",
  "end_date": "2026-02-08",
  "responsable_ids": [12]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "name": "Actividad actualizada",
    "priority": 2,
    ...
  },
  "message": "Actividad actualizada correctamente"
}
```

---

### DELETE `/api/calendar/activities/{id}`
Elimina una actividad (soft delete).

**Response (200):**
```json
{
  "success": true,
  "message": "Actividad eliminada correctamente"
}
```

---

## 2. Endpoints de Catálogo de Actividades

El catálogo de actividades contiene las actividades predefinidas que pueden ser reutilizadas al crear nuevas asignaciones.

### GET `/api/calendar/activity-catalog`
Obtiene la lista de actividades predefinidas del catálogo.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Revisión de documentos"
    },
    {
      "id": 2,
      "name": "Coordinación de envío"
    },
    {
      "id": 3,
      "name": "Verificación de contenedor"
    },
    {
      "id": 4,
      "name": "Gestión de aduanas"
    },
    {
      "id": 5,
      "name": "Control de calidad"
    }
  ],
  "message": "Catálogo de actividades obtenido"
}
```

---

### POST `/api/calendar/activity-catalog`
Crea una nueva actividad en el catálogo.

**Permisos:** Solo Jefe de Importaciones

**Request Body:**
```json
{
  "name": "Nueva actividad del catálogo"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la actividad (único) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "Nueva actividad del catálogo"
  },
  "message": "Actividad creada en el catálogo"
}
```

**Errores:**
- 400: "Ya existe una actividad con ese nombre"
- 400: "El nombre es requerido"
- 400: "El nombre debe tener al menos 3 caracteres"

---

### PUT `/api/calendar/activity-catalog/{id}`
Actualiza el nombre de una actividad del catálogo.

**Permisos:** Solo Jefe de Importaciones

**Request Body:**
```json
{
  "name": "Nombre actualizado"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "Nombre actualizado"
  },
  "message": "Actividad actualizada"
}
```

---

### DELETE `/api/calendar/activity-catalog/{id}`
Elimina una actividad del catálogo.

**Permisos:** Solo Jefe de Importaciones

**Nota:** Solo se puede eliminar si no está siendo usada en ningún evento.

**Response (200):**
```json
{
  "success": true,
  "message": "Actividad eliminada del catálogo"
}
```

**Errores:**
- 400: "No se puede eliminar porque está siendo usada en eventos"

---

## 3. Endpoints de Estado y Prioridad

### PUT `/api/calendar/charges/{charge_id}/status`
Actualiza el estado de un responsable asignado.

**Permisos:**
- Jefe de Importaciones: Puede cambiar cualquier estado
- Coordinación/Documentación: Solo puede cambiar su propio estado

**Request Body:**
```json
{
  "status": "PROGRESO"
}
```

| Campo | Tipo | Valores válidos |
|-------|------|-----------------|
| `status` | string | "PENDIENTE", "PROGRESO", "COMPLETADO" |

**Response (200):**
```json
{
  "success": true,
  "message": "Estado actualizado correctamente"
}
```

---

### PUT `/api/calendar/activities/{id}/priority`
Actualiza la prioridad de una actividad.

**Permisos:** Solo Jefe de Importaciones

**Request Body:**
```json
{
  "priority": 2
}
```

| Campo | Tipo | Valores válidos |
|-------|------|-----------------|
| `priority` | number | 0 (Bajo), 1 (Medio), 2 (Alto) |

**Response (200):**
```json
{
  "success": true,
  "message": "Prioridad actualizada correctamente"
}
```

---

## 4. Endpoints de Notas

### PUT `/api/calendar/charges/{charge_id}/notes`
Actualiza las notas de un responsable específico.

**Request Body:**
```json
{
  "notes": "Mis notas sobre esta tarea"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notas actualizadas correctamente"
}
```

---

### PUT `/api/calendar/activities/{id}/notes`
Actualiza las notas generales de una actividad.

**Request Body:**
```json
{
  "notes": "Notas generales de la actividad"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notas actualizadas correctamente"
}
```

---

## 5. Endpoints de Responsables

### GET `/api/calendar/responsables`
Obtiene la lista de responsables disponibles (usuarios con rol Coordinación o Documentación).

**IMPORTANTE:** Este endpoint debe incluir el color asignado a cada responsable desde la tabla `calendar_user_color_config`.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "nombre": "Danitza",
      "email": "danitza@probusiness.com",
      "avatar": null,
      "color": "#8B5CF6"
    },
    {
      "id": 13,
      "nombre": "Daniela",
      "email": "daniela@probusiness.com",
      "avatar": null,
      "color": "#EC4899"
    },
    {
      "id": 15,
      "nombre": "Patrick",
      "email": "patrick@probusiness.com",
      "avatar": null,
      "color": "#3B82F6"
    },
    {
      "id": 18,
      "nombre": "Meliza",
      "email": "meliza@probusiness.com",
      "avatar": null,
      "color": "#10B981"
    }
  ],
  "message": "Responsables obtenidos correctamente"
}
```

---

### POST `/api/calendar/activities/{id}/responsables`
Asigna un responsable a una actividad.

**Permisos:** Solo Jefe de Importaciones

**Request Body:**
```json
{
  "user_id": 15
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Responsable asignado correctamente"
}
```

**Errores:**
- 400: "La actividad ya tiene el máximo de 2 responsables"
- 400: "El usuario ya está asignado a esta actividad"

---

### DELETE `/api/calendar/activities/{id}/responsables/{user_id}`
Remueve un responsable de una actividad.

**Permisos:** Solo Jefe de Importaciones

**Response (200):**
```json
{
  "success": true,
  "message": "Responsable removido correctamente"
}
```

---

## 6. Endpoints de Colores

### GET `/api/calendar/colors`
Obtiene la configuración de colores de todos los usuarios.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_id": 5,
      "user_id": 12,
      "color_code": "#8B5CF6",
      "user": {
        "id": 12,
        "nombre": "Danitza"
      }
    },
    {
      "id": 2,
      "calendar_id": 5,
      "user_id": 13,
      "color_code": "#EC4899",
      "user": {
        "id": 13,
        "nombre": "Daniela"
      }
    }
  ],
  "message": "Configuración de colores obtenida"
}
```

---

### PUT `/api/calendar/colors`
Actualiza el color de un usuario.

**Permisos:** Solo Jefe de Importaciones

**Request Body:**
```json
{
  "user_id": 12,
  "color_code": "#3B82F6"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Color actualizado correctamente"
}
```

---

## 7. Endpoints de Contenedores

### GET `/api/calendar/contenedores`
Obtiene la lista de consolidados disponibles para filtro.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "nombre": "Consolidado ABC",
      "codigo": "CONT-2026-001"
    },
    {
      "id": 11,
      "nombre": "Consolidado XYZ",
      "codigo": "CONT-2026-002"
    }
  ],
  "message": "Contenedores obtenidos correctamente"
}
```

---

## 8. Endpoints de Progreso

### GET `/api/calendar/progress`
Obtiene estadísticas de progreso del equipo y por responsable.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start_date` | string | Fecha inicio para filtrar |
| `end_date` | string | Fecha fin para filtrar |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "team": {
      "total_actividades": 25,
      "completadas": 10,
      "en_progreso": 8,
      "pendientes": 7,
      "porcentaje_completado": 40
    },
    "by_responsable": [
      {
        "user_id": 12,
        "nombre": "Danitza",
        "color": "#8B5CF6",
        "total_asignadas": 8,
        "completadas": 5,
        "en_progreso": 2,
        "pendientes": 1,
        "porcentaje_completado": 62
      },
      {
        "user_id": 13,
        "nombre": "Daniela",
        "color": "#EC4899",
        "total_asignadas": 6,
        "completadas": 2,
        "en_progreso": 3,
        "pendientes": 1,
        "porcentaje_completado": 33
      },
      {
        "user_id": 15,
        "nombre": "Patrick",
        "color": "#3B82F6",
        "total_asignadas": 7,
        "completadas": 2,
        "en_progreso": 2,
        "pendientes": 3,
        "porcentaje_completado": 28
      },
      {
        "user_id": 18,
        "nombre": "Meliza",
        "color": "#10B981",
        "total_asignadas": 4,
        "completadas": 1,
        "en_progreso": 1,
        "pendientes": 2,
        "porcentaje_completado": 25
      }
    ]
  },
  "message": "Progreso obtenido correctamente"
}
```

---

## 9. Endpoints de Tracking / Historial

### GET `/api/calendar/charges/{chargeId}/tracking`
Obtiene el historial de cambios de estado de un charge (responsable asignado) específico.

**Permisos:**
- Jefe de Importaciones: ✅
- Coordinación: ✅ (solo sus propios charges)
- Documentación: ✅ (solo sus propios charges)

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `chargeId` | number | Sí | ID del charge |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_event_charge_id": 2,
      "from_status": "PENDIENTE",
      "to_status": "PROGRESO",
      "changed_at": "2026-02-03T17:53:03Z",
      "changed_by": 28,
      "changed_by_user": {
        "id": 28,
        "nombre": "Usuario Modificador",
        "email": "usuario@probusiness.com"
      },
      "charge": {
        "id": 2,
        "user_id": 12,
        "calendar_event_id": 5,
        "status": "PROGRESO",
        "user": {
          "id": 12,
          "nombre": "Danitza",
          "email": "danitza@probusiness.com"
        }
      }
    },
    {
      "id": 2,
      "calendar_event_charge_id": 2,
      "from_status": "PROGRESO",
      "to_status": "COMPLETADO",
      "changed_at": "2026-02-03T18:30:00Z",
      "changed_by": 12,
      "changed_by_user": {
        "id": 12,
        "nombre": "Danitza",
        "email": "danitza@probusiness.com"
      },
      "charge": {
        "id": 2,
        "user_id": 12,
        "calendar_event_id": 5,
        "status": "COMPLETADO",
        "user": {
          "id": 12,
          "nombre": "Danitza",
          "email": "danitza@probusiness.com"
        }
      }
    }
  ],
  "message": "Historial obtenido correctamente"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Charge no encontrado"
}
```

---

### GET `/api/calendar/activities/{activityId}/tracking`
Obtiene el historial de cambios de estado de todos los charges de una actividad.

**Permisos:**
- Jefe de Importaciones: ✅
- Coordinación: ✅ (solo actividades donde está asignado)
- Documentación: ✅ (solo actividades donde está asignado)

**Path Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `activityId` | number | Sí | ID de la actividad |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_event_charge_id": 2,
      "from_status": null,
      "to_status": "PENDIENTE",
      "changed_at": "2026-02-01T10:00:00Z",
      "changed_by": 5,
      "changed_by_user": {
        "id": 5,
        "nombre": "Jefe Importaciones",
        "email": "jefe@probusiness.com"
      },
      "charge": {
        "id": 2,
        "user_id": 12,
        "calendar_event_id": 5,
        "status": "COMPLETADO",
        "user": {
          "id": 12,
          "nombre": "Danitza",
          "email": "danitza@probusiness.com"
        }
      }
    },
    {
      "id": 2,
      "calendar_event_charge_id": 2,
      "from_status": "PENDIENTE",
      "to_status": "PROGRESO",
      "changed_at": "2026-02-03T17:53:03Z",
      "changed_by": 12,
      "changed_by_user": {
        "id": 12,
        "nombre": "Danitza",
        "email": "danitza@probusiness.com"
      },
      "charge": {
        "id": 2,
        "user_id": 12,
        "calendar_event_id": 5,
        "status": "COMPLETADO",
        "user": {
          "id": 12,
          "nombre": "Danitza",
          "email": "danitza@probusiness.com"
        }
      }
    },
    {
      "id": 3,
      "calendar_event_charge_id": 4,
      "from_status": "PENDIENTE",
      "to_status": "COMPLETADO",
      "changed_at": "2026-02-03T17:53:07Z",
      "changed_by": 18,
      "changed_by_user": {
        "id": 18,
        "nombre": "Meliza",
        "email": "meliza@probusiness.com"
      },
      "charge": {
        "id": 4,
        "user_id": 18,
        "calendar_event_id": 5,
        "status": "COMPLETADO",
        "user": {
          "id": 18,
          "nombre": "Meliza",
          "email": "meliza@probusiness.com"
        }
      }
    }
  ],
  "message": "Historial de actividad obtenido correctamente"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Actividad no encontrada"
}
```

**Notas:**
- Los registros se ordenan por `changed_at` de más antiguo a más reciente
- `from_status: null` indica que es el registro inicial (asignación del responsable)
- La tabla `calendar_event_charge_tracking` se debe poblar automáticamente cada vez que se actualiza el estado de un charge mediante triggers o en el backend

---

## 10. Permisos por Rol

### Tabla de Permisos

| Acción | Jefe Importaciones | Coordinación | Documentación |
|--------|:------------------:|:------------:|:-------------:|
| Ver todas las actividades | ✅ | ❌ | ❌ |
| Ver solo mis actividades | ✅ | ✅ | ✅ |
| Crear actividad | ✅ | ❌ | ❌ |
| Editar actividad | ✅ | ❌ | ❌ |
| Eliminar actividad | ✅ | ❌ | ❌ |
| Cambiar prioridad | ✅ | ❌ | ❌ |
| Cambiar cualquier estado | ✅ | ❌ | ❌ |
| Cambiar mi propio estado | ✅ | ✅ | ✅ |
| Asignar responsables | ✅ | ❌ | ❌ |
| Ver tracking de actividad | ✅ | ✅ | ✅ |
| Ver progreso del equipo | ✅ | ❌ | ❌ |
| Configurar colores | ✅ | ❌ | ❌ |
| Filtrar por responsable | ✅ | ❌ | ❌ |
| Filtrar por consolidado | ✅ | ✅ | ✅ |
| Acceder a configuración | ✅ | ❌ | ❌ |

---

## Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos para la acción |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Validación fallida |
| 500 | Internal Server Error - Error del servidor |

**Ejemplo de Error:**
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción",
  "errors": {
    "permission": ["Solo el Jefe de Importaciones puede cambiar la prioridad"]
  }
}
```

---

## Tablas de Base de Datos

### calendars
```sql
CREATE TABLE calendars (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### calendar_events
```sql
CREATE TABLE calendar_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    priority TINYINT DEFAULT 0, -- 0: Bajo, 1: Medio, 2: Alto
    name VARCHAR(255) NOT NULL,
    contenedor_id BIGINT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

### calendar_event_days
```sql
CREATE TABLE calendar_event_days (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    calendar_event_id BIGINT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### calendar_event_charges
```sql
CREATE TABLE calendar_event_charges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    calendar_event_id BIGINT NOT NULL,
    notes TEXT NULL,
    assigned_at TIMESTAMP NULL,
    removed_at TIMESTAMP NULL,
    status ENUM('PENDIENTE', 'PROGRESO', 'COMPLETADO') DEFAULT 'PENDIENTE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### calendar_event_charge_tracking
```sql
CREATE TABLE calendar_event_charge_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_event_charge_id BIGINT NOT NULL,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    changed_by BIGINT NULL
);
```

### calendar_user_color_config
```sql
CREATE TABLE calendar_user_color_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    color_code VARCHAR(7) NOT NULL, -- Hex #RRGGBB
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
