# Especificación de API - Calendario Jefe de Importaciones

## Tablas de Base de Datos

```
1. calendars
   - id (PK)
   - user_id (FK → usuario.ID_Usuario)
   - created_at, updated_at

2. calendar_events
   - id (PK)
   - calendar_id (FK → calendars.id)
   - priority (integer, default 0) → 0: Bajo, 1: Medio, 2: Alto
   - name (string)
   - contenedor_id (FK → carga_consolidada_contenedor.id, nullable)
   - notes (text, nullable)
   - created_at, updated_at, deleted_at (soft deletes)

3. calendar_event_days
   - id (PK)
   - calendar_id (FK → calendars.id)
   - calendar_event_id (FK → calendar_events.id)
   - date (date, YYYY-MM-DD)
   - created_at, updated_at

4. calendar_event_charges
   - id (PK)
   - calendar_id (FK → calendars.id)
   - user_id (FK → usuario.ID_Usuario)
   - calendar_event_id (FK → calendar_events.id)
   - notes (text, nullable)
   - assigned_at (timestamp, nullable)
   - removed_at (timestamp, nullable)
   - status (enum: 'PENDIENTE', 'PROGRESO', 'COMPLETADO')
   - created_at, updated_at

5. calendar_event_charge_tracking
   - id (PK)
   - calendar_event_charge_id (FK → calendar_event_charges.id)
   - from_status (string, nullable)
   - to_status (string)
   - changed_at (timestamp)
   - changed_by (FK → usuario.ID_Usuario, nullable)

6. calendar_user_color_config
   - id (PK)
   - calendar_id (FK → calendars.id)
   - user_id (FK → usuario.ID_Usuario)
   - color_code (string, ej: #RRGGBB)
   - created_at, updated_at
   - UNIQUE(calendar_id, user_id)
```

---

## Endpoints y Respuestas Esperadas

### 1. GET /api/calendar/events

Obtener lista de eventos/actividades con filtros opcionales.

**Query Parameters:**
```
start_date: string (YYYY-MM-DD) - Filtrar desde esta fecha
end_date: string (YYYY-MM-DD) - Filtrar hasta esta fecha
responsable_id: number - Filtrar por responsable
contenedor_id: number - Filtrar por contenedor
status: string ('PENDIENTE' | 'PROGRESO' | 'COMPLETADO')
priority: number (0 | 1 | 2)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_id": 1,
      "priority": 2,
      "name": "Solicitar documentos",
      "contenedor_id": 42,
      "notes": "Notas generales de la actividad",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z",
      "deleted_at": null,
      "days": [
        {
          "id": 1,
          "calendar_id": 1,
          "calendar_event_id": 1,
          "date": "2026-01-15",
          "created_at": "2026-01-15T10:00:00Z",
          "updated_at": "2026-01-15T10:00:00Z"
        },
        {
          "id": 2,
          "calendar_id": 1,
          "calendar_event_id": 1,
          "date": "2026-01-16",
          "created_at": "2026-01-15T10:00:00Z",
          "updated_at": "2026-01-15T10:00:00Z"
        }
      ],
      "charges": [
        {
          "id": 1,
          "calendar_id": 1,
          "user_id": 100,
          "calendar_event_id": 1,
          "notes": "Notas del responsable",
          "assigned_at": "2026-01-15T10:00:00Z",
          "removed_at": null,
          "status": "PROGRESO",
          "created_at": "2026-01-15T10:00:00Z",
          "updated_at": "2026-01-15T10:00:00Z",
          "user": {
            "id": 100,
            "nombre": "Danitza",
            "email": "danitza@empresa.com",
            "avatar": null
          }
        }
      ],
      "contenedor": {
        "id": 42,
        "nombre": "01 - 2026",
        "codigo": "CONT-2026-001"
      },
      "start_date": "2026-01-15",
      "end_date": "2026-01-16",
      "duration": 2
    }
  ],
  "message": "Eventos obtenidos correctamente"
}
```

---

### 2. GET /api/calendar/events/{id}

Obtener detalle de un evento específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "calendar_id": 1,
    "priority": 2,
    "name": "Solicitar documentos",
    "contenedor_id": 42,
    "notes": "Notas generales",
    "days": [...],
    "charges": [...],
    "contenedor": {...}
  }
}
```

---

### 3. POST /api/calendar/activities

Crear una nueva actividad.

**Request Body:**
```json
{
  "name": "Revisar documentos",
  "priority": 1,
  "contenedor_id": 42,
  "notes": "Notas iniciales",
  "start_date": "2026-01-20",
  "end_date": "2026-01-25",
  "responsable_ids": [100, 101]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "calendar_id": 1,
    "priority": 1,
    "name": "Revisar documentos",
    "contenedor_id": 42,
    "notes": "Notas iniciales",
    "days": [
      { "id": 3, "date": "2026-01-20" },
      { "id": 4, "date": "2026-01-21" },
      { "id": 5, "date": "2026-01-22" },
      { "id": 6, "date": "2026-01-23" },
      { "id": 7, "date": "2026-01-24" },
      { "id": 8, "date": "2026-01-25" }
    ],
    "charges": [
      {
        "id": 2,
        "user_id": 100,
        "status": "PENDIENTE",
        "user": { "id": 100, "nombre": "Danitza" }
      },
      {
        "id": 3,
        "user_id": 101,
        "status": "PENDIENTE",
        "user": { "id": 101, "nombre": "Daniela" }
      }
    ],
    "contenedor": { "id": 42, "nombre": "01 - 2026" }
  },
  "message": "Actividad creada correctamente"
}
```

---

### 4. PUT /api/calendar/activities/{id}

Actualizar una actividad existente.

**Request Body:**
```json
{
  "name": "Revisar documentos - Actualizado",
  "priority": 2,
  "contenedor_id": 43,
  "notes": "Notas actualizadas",
  "start_date": "2026-01-20",
  "end_date": "2026-01-28",
  "responsable_ids": [100]
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Actividad actualizada correctamente"
}
```

---

### 5. DELETE /api/calendar/activities/{id}

Eliminar una actividad (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Actividad eliminada correctamente"
}
```

---

### 6. PUT /api/calendar/charges/{charge_id}/status

Actualizar el estado de un responsable asignado.

**Request Body:**
```json
{
  "status": "COMPLETADO"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Estado actualizado correctamente"
}
```

**Nota:** Este endpoint debe:
1. Validar que el usuario tiene permiso para cambiar el estado
2. Si el usuario es Jefe de Importaciones, puede cambiar cualquier estado
3. Si es Coordinación/Documentación, solo puede cambiar el estado de su propio charge
4. Registrar el cambio en `calendar_event_charge_tracking`

---

### 7. PUT /api/calendar/activities/{id}/priority

Actualizar la prioridad de una actividad (solo Jefe de Importaciones).

**Request Body:**
```json
{
  "priority": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prioridad actualizada correctamente"
}
```

---

### 8. PUT /api/calendar/charges/{charge_id}/notes

Actualizar las notas de un responsable.

**Request Body:**
```json
{
  "notes": "Nueva nota del responsable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notas actualizadas correctamente"
}
```

---

### 9. PUT /api/calendar/activities/{id}/notes

Actualizar las notas generales de la actividad.

**Request Body:**
```json
{
  "notes": "Notas generales actualizadas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notas actualizadas correctamente"
}
```

---

### 10. GET /api/calendar/responsables

Obtener lista de usuarios que pueden ser responsables (perfiles Coordinación y Documentación).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "nombre": "Danitza",
      "email": "danitza@empresa.com",
      "avatar": null,
      "color": "#8B5CF6"
    },
    {
      "id": 101,
      "nombre": "Daniela",
      "email": "daniela@empresa.com",
      "avatar": null,
      "color": "#EC4899"
    },
    {
      "id": 102,
      "nombre": "Patrick",
      "email": "patrick@empresa.com",
      "avatar": null,
      "color": "#3B82F6"
    },
    {
      "id": 103,
      "nombre": "Meliza",
      "email": "meliza@empresa.com",
      "avatar": null,
      "color": "#10B981"
    }
  ]
}
```

---

### 11. POST /api/calendar/activities/{id}/responsables

Asignar un responsable a una actividad.

**Request Body:**
```json
{
  "user_id": 102
}
```

**Response:**
```json
{
  "success": true,
  "message": "Responsable asignado correctamente"
}
```

---

### 12. DELETE /api/calendar/activities/{id}/responsables/{user_id}

Remover un responsable de una actividad.

**Response:**
```json
{
  "success": true,
  "message": "Responsable removido correctamente"
}
```

---

### 13. GET /api/calendar/colors

Obtener configuración de colores de usuarios.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "calendar_id": 1,
      "user_id": 100,
      "color_code": "#8B5CF6",
      "created_at": "2026-01-10T10:00:00Z",
      "updated_at": "2026-01-10T10:00:00Z",
      "user": {
        "id": 100,
        "nombre": "Danitza"
      }
    },
    {
      "id": 2,
      "calendar_id": 1,
      "user_id": 101,
      "color_code": "#EC4899",
      "created_at": "2026-01-10T10:00:00Z",
      "updated_at": "2026-01-10T10:00:00Z",
      "user": {
        "id": 101,
        "nombre": "Daniela"
      }
    }
  ]
}
```

---

### 14. PUT /api/calendar/colors

Actualizar o crear el color de un usuario.

**Request Body:**
```json
{
  "user_id": 100,
  "color_code": "#FF5733"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Color actualizado correctamente"
}
```

---

### 15. GET /api/calendar/contenedores

Obtener contenedores disponibles para el filtro.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "nombre": "01 - 2026",
      "codigo": "CONT-2026-001"
    },
    {
      "id": 43,
      "nombre": "02 - 2026",
      "codigo": "CONT-2026-002"
    },
    {
      "id": 44,
      "nombre": "03 - 2026",
      "codigo": "CONT-2026-003"
    }
  ]
}
```

---

### 16. GET /api/calendar/progress

Obtener estadísticas de progreso del equipo y por responsable.

**Query Parameters:**
```
start_date: string (YYYY-MM-DD) - Filtrar desde
end_date: string (YYYY-MM-DD) - Filtrar hasta
responsable_id: number - Filtrar por responsable específico
contenedor_id: number - Filtrar por contenedor
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": {
      "total_actividades": 25,
      "completadas": 15,
      "en_progreso": 5,
      "pendientes": 5,
      "porcentaje_completado": 60
    },
    "by_responsable": [
      {
        "user_id": 100,
        "nombre": "Danitza",
        "color": "#8B5CF6",
        "total_asignadas": 8,
        "completadas": 5,
        "en_progreso": 2,
        "pendientes": 1,
        "porcentaje_completado": 62
      },
      {
        "user_id": 101,
        "nombre": "Daniela",
        "color": "#EC4899",
        "total_asignadas": 7,
        "completadas": 4,
        "en_progreso": 2,
        "pendientes": 1,
        "porcentaje_completado": 57
      },
      {
        "user_id": 102,
        "nombre": "Patrick",
        "color": "#3B82F6",
        "total_asignadas": 6,
        "completadas": 4,
        "en_progreso": 1,
        "pendientes": 1,
        "porcentaje_completado": 67
      },
      {
        "user_id": 103,
        "nombre": "Meliza",
        "color": "#10B981",
        "total_asignadas": 4,
        "completadas": 2,
        "en_progreso": 0,
        "pendientes": 2,
        "porcentaje_completado": 50
      }
    ]
  }
}
```

---

## Reglas de Negocio

### Permisos por Rol

| Acción | Jefe Importaciones | Coordinación | Documentación |
|--------|-------------------|--------------|---------------|
| Ver todas las actividades | ✅ | ❌ | ❌ |
| Ver solo mis actividades | - | ✅ | ✅ |
| Crear actividad | ✅ | ❌ | ❌ |
| Editar actividad | ✅ | ❌ | ❌ |
| Eliminar actividad | ✅ | ❌ | ❌ |
| Cambiar prioridad | ✅ | ❌ | ❌ |
| Cambiar cualquier estado | ✅ | ❌ | ❌ |
| Cambiar mi estado | ✅ | ✅ | ✅ |
| Asignar responsables | ✅ | ❌ | ❌ |
| Ver progreso del equipo | ✅ | ❌ | ❌ |
| Ver mi progreso | ✅ | ✅ | ✅ |
| Configurar colores | ✅ | ❌ | ❌ |
| Agregar notas propias | ✅ | ✅ | ✅ |
| Filtrar por responsable | ✅ | ❌ | ❌ |
| Filtrar por contenedor | ✅ | ✅ | ✅ |

### Prioridades
- `0`: Bajo (Verde)
- `1`: Medio (Amarillo)
- `2`: Alto (Rojo)

### Estados
- `PENDIENTE`: Actividad no iniciada (Amarillo)
- `PROGRESO`: Actividad en curso (Azul)
- `COMPLETADO`: Actividad finalizada (Verde)

### Límites
- Máximo 2 responsables por actividad
- Los colores son hexadecimales (#RRGGBB)
- Las fechas usan formato ISO 8601 (YYYY-MM-DD)

---

## Fecha de Documentación
2 de febrero de 2026

## Versión
1.0.0
