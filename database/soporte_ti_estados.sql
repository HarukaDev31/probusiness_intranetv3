-- Referencia de esquema para Laravel (PHP 7) — módulo Soporte TI
-- Catálogo de estados + historial de cambios (separado de soporte_ti_solicitudes.estado string)

CREATE TABLE soporte_ti_estados (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  tipo_solicitud CHAR(1) NULL COMMENT 'A, B o NULL = ambos',
  orden_kanban TINYINT UNSIGNED NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_soporte_ti_estados_codigo (codigo)
);

INSERT INTO soporte_ti_estados (id, codigo, nombre, tipo_solicitud, orden_kanban) VALUES
(1, 'pendiente', 'Pendiente', NULL, 1),
(2, 'en_maqueta', 'En maqueta', 'A', 2),
(3, 'en_progreso', 'En progreso', NULL, 3),
(4, 'hecho', 'Hecho', 'B', 4),
(5, 'desplegado', 'Desplegado', NULL, 5),
(6, 'observado', 'Observado', NULL, 6),
(7, 'operativo', 'Operativo', NULL, 7);

-- Historial: cada transición de estado (auditoría + origen de notificaciones WS)
CREATE TABLE soporte_ti_solicitud_estados (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitud_id BIGINT UNSIGNED NOT NULL,
  estado_id TINYINT UNSIGNED NOT NULL,
  estado_anterior_id TINYINT UNSIGNED NULL,
  usuario_id BIGINT UNSIGNED NULL,
  comentario TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ste_solicitud (solicitud_id),
  KEY idx_ste_estado (estado_id),
  CONSTRAINT fk_ste_solicitud FOREIGN KEY (solicitud_id) REFERENCES soporte_ti_solicitudes (id),
  CONSTRAINT fk_ste_estado FOREIGN KEY (estado_id) REFERENCES soporte_ti_estados (id),
  CONSTRAINT fk_ste_estado_ant FOREIGN KEY (estado_anterior_id) REFERENCES soporte_ti_estados (id)
);

-- En soporte_ti_solicitudes reemplazar columna estado VARCHAR por FK:
--   estado_actual_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
--   CONSTRAINT fk_sol_estado FOREIGN KEY (estado_actual_id) REFERENCES soporte_ti_estados (id)

-- Transiciones permitidas por rol (opcional, validación en back)
CREATE TABLE soporte_ti_estado_transiciones (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  estado_origen_id TINYINT UNSIGNED NOT NULL,
  estado_destino_id TINYINT UNSIGNED NOT NULL,
  rol VARCHAR(30) NOT NULL COMMENT 'solicitante, pm, analista',
  tipo_solicitud CHAR(1) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transicion (estado_origen_id, estado_destino_id, rol, tipo_solicitud),
  CONSTRAINT fk_tr_origen FOREIGN KEY (estado_origen_id) REFERENCES soporte_ti_estados (id),
  CONSTRAINT fk_tr_destino FOREIGN KEY (estado_destino_id) REFERENCES soporte_ti_estados (id)
);
