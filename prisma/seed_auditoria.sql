-- =============================================================
-- SCRIPT: Crear tabla + poblar auditoría con datos reales
-- Pegar en Supabase → SQL Editor → Run
-- =============================================================

-- 1. Crear enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditSeveridad') THEN
        CREATE TYPE "AuditSeveridad" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
    END IF;
END$$;

-- 2. Crear tabla
CREATE TABLE IF NOT EXISTS registro_auditoria (
    id              BIGSERIAL PRIMARY KEY,
    fecha_hora      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    usuario_id      BIGINT       REFERENCES usuario(usuario_id),
    nombre_usuario  VARCHAR(200) NOT NULL,
    rol_usuario     VARCHAR(60)  NOT NULL,
    modulo          VARCHAR(60)  NOT NULL,
    accion          VARCHAR(100) NOT NULL,
    descripcion     TEXT         NOT NULL,
    severidad       "AuditSeveridad" NOT NULL DEFAULT 'INFO',
    entidad_tipo    VARCHAR(80),
    entidad_id      VARCHAR(40),
    metadatos       JSONB,
    ip_origen       VARCHAR(45)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_audit_fecha    ON registro_auditoria (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_audit_modulo   ON registro_auditoria (modulo);
CREATE INDEX IF NOT EXISTS idx_audit_usuario  ON registro_auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_accion   ON registro_auditoria (accion);


-- =============================================================
-- 4. SEED: último movimiento de cada área
-- =============================================================

-- ── AUTH: últimos logins ──────────────────────────────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id)
SELECT
    COALESCE(u.ultimo_acceso, u.fecha_creacion),
    u.usuario_id,
    u.email,
    r.nombre,
    'AUTH',
    'LOGIN',
    'Inicio de sesión: ' || u.email,
    'INFO',
    'Usuario',
    u.usuario_id::text
FROM usuario u
JOIN rol r ON r.rol_id = u.rol_id
WHERE u.ultimo_acceso IS NOT NULL
ORDER BY u.ultimo_acceso DESC
LIMIT 3;


-- ── RECEPCIÓN: últimas citas agendadas ───────────────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    cm.fecha_creacion,
    cm.usuario_creacion,
    COALESCE(u.email, 'recepcion@clinica'),
    COALESCE(r.nombre, 'RECEPCION'),
    'RECEPCION',
    'CITA_AGENDADA',
    'Cita agendada para ' || p.nombres || ' ' || p.apellidos
        || ' — ' || cm.tipo_cita || ' (' || cm.estado_cita || ')',
    'INFO',
    'CitaMedica',
    cm.cita_id::text,
    jsonb_build_object(
        'tipoCita',  cm.tipo_cita,
        'estado',    cm.estado_cita,
        'paciente',  p.nombres || ' ' || p.apellidos
    )
FROM cita_medica cm
JOIN paciente p ON p.paciente_id = cm.paciente_id
JOIN usuario u  ON u.usuario_id  = cm.usuario_creacion
JOIN rol r      ON r.rol_id      = u.rol_id
WHERE cm.tipo_cita != 'EMERGENCIA'
ORDER BY cm.fecha_creacion DESC
LIMIT 2;


-- ── EMERGENCIAS: últimos ingresos ────────────────────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    e.fecha_ingreso,
    cm.usuario_creacion,
    COALESCE(u.email, 'recepcion@clinica'),
    COALESCE(r.nombre, 'RECEPCION'),
    'EMERGENCIAS',
    'EMERGENCIA_CREADA',
    'Ingreso de emergencia — ' || p.nombres || ' ' || p.apellidos
        || ' (Nivel: ' || e.nivel_urgencia || ')',
    CASE WHEN e.nivel_urgencia IN ('CRITICO','URGENTE')
         THEN 'WARNING'::"AuditSeveridad"
         ELSE 'INFO'::"AuditSeveridad"
    END,
    'Emergencia',
    e.emergencia_id::text,
    jsonb_build_object(
        'paciente',        p.nombres || ' ' || p.apellidos,
        'nivelUrgencia',   e.nivel_urgencia,
        'estadoActual',    e.estado_emergencia,
        'motivoIngreso',   e.motivo_ingreso
    )
FROM emergencia e
JOIN paciente p     ON p.paciente_id = e.paciente_id
LEFT JOIN cita_medica cm ON cm.cita_id = e.cita_id
LEFT JOIN usuario u ON u.usuario_id = cm.usuario_creacion
LEFT JOIN rol r     ON r.rol_id     = u.rol_id
ORDER BY e.fecha_ingreso DESC
LIMIT 3;


-- ── EMERGENCIAS: últimos cambios de estado ───────────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    COALESCE(e.fecha_alta, e.fecha_ingreso + interval '2 hours'),
    cm.usuario_creacion,
    COALESCE(u.email, 'medico@clinica'),
    COALESCE(r.nombre, 'MEDICO'),
    'EMERGENCIAS',
    'EMERGENCIA_ESTADO_CAMBIADO',
    'Emergencia #' || e.emergencia_id || ' — Estado: ' || e.estado_emergencia
        || ' | Paciente: ' || p.nombres || ' ' || p.apellidos,
    CASE WHEN e.estado_emergencia IN ('CIRUGIA_URGENTE','ALTA','REFERIDO')
         THEN 'WARNING'::"AuditSeveridad"
         ELSE 'INFO'::"AuditSeveridad"
    END,
    'Emergencia',
    e.emergencia_id::text,
    jsonb_build_object('estadoFinal', e.estado_emergencia, 'nivelUrgencia', e.nivel_urgencia)
FROM emergencia e
JOIN paciente p      ON p.paciente_id = e.paciente_id
LEFT JOIN cita_medica cm ON cm.cita_id = e.cita_id
LEFT JOIN usuario u  ON u.usuario_id = cm.usuario_creacion
LEFT JOIN rol r      ON r.rol_id     = u.rol_id
WHERE e.estado_emergencia NOT IN ('EN_ATENCION')
ORDER BY COALESCE(e.fecha_alta, e.fecha_ingreso) DESC
LIMIT 2;


-- ── LABORATORIO: últimas solicitudes atendidas ───────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    sl.fecha_solicitud,
    sl.usuario_solicita,
    COALESCE(u.email, 'laboratorio@clinica'),
    COALESCE(r.nombre, 'LABORATORIO'),
    'LABORATORIO',
    'RESULTADO_LAB_REGISTRADO',
    'Solicitud de laboratorio #' || sl.solicitud_lab_id
        || ' — Paciente: ' || p.nombres || ' ' || p.apellidos
        || ' (' || sl.estado_solicitud || ')',
    'INFO',
    'SolicitudLaboratorio',
    sl.solicitud_lab_id::text,
    jsonb_build_object('estado', sl.estado_solicitud, 'paciente', p.nombres || ' ' || p.apellidos)
FROM solicitud_laboratorio sl
JOIN cita_medica cm ON cm.cita_id   = sl.cita_id
JOIN paciente p     ON p.paciente_id = cm.paciente_id
JOIN usuario u      ON u.usuario_id  = sl.usuario_solicita
JOIN rol r          ON r.rol_id      = u.rol_id
ORDER BY sl.fecha_solicitud DESC
LIMIT 2;


-- ── FARMACIA: últimas solicitudes despachadas/rechazadas ─────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    COALESCE(si.fecha_respuesta, si.fecha_solicitud),
    si.usuario_responde,
    COALESCE(u.email, 'farmacia@clinica'),
    COALESCE(r.nombre, 'FARMACIA'),
    'FARMACIA',
    CASE si.estado_solicitud
        WHEN 'DESPACHADA' THEN 'SOLICITUD_DESPACHADA'
        WHEN 'RECHAZADA'  THEN 'SOLICITUD_RECHAZADA'
        ELSE 'SOLICITUD_APROBADA'
    END,
    'Solicitud de insumos #' || si.solicitud_insumo_id
        || ' — ' || si.estado_solicitud
        || ' | Paciente: ' || p.nombres || ' ' || p.apellidos,
    CASE WHEN si.estado_solicitud = 'RECHAZADA'
         THEN 'WARNING'::"AuditSeveridad"
         ELSE 'INFO'::"AuditSeveridad"
    END,
    'SolicitudInsumo',
    si.solicitud_insumo_id::text,
    jsonb_build_object('estado', si.estado_solicitud, 'paciente', p.nombres || ' ' || p.apellidos)
FROM solicitud_insumo si
JOIN cita_medica cm ON cm.cita_id    = si.cita_id
JOIN paciente p     ON p.paciente_id = cm.paciente_id
LEFT JOIN usuario u ON u.usuario_id  = si.usuario_responde
LEFT JOIN rol r     ON r.rol_id      = u.rol_id
WHERE si.estado_solicitud IN ('DESPACHADA','RECHAZADA','APROBADA')
ORDER BY COALESCE(si.fecha_respuesta, si.fecha_solicitud) DESC
LIMIT 3;


-- ── ALMACÉN: últimos movimientos de inventario ───────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    mi.fecha_movimiento,
    mi.usuario_id,
    COALESCE(u.email, 'almacen@clinica'),
    COALESCE(r.nombre, 'ALMACEN'),
    'ALMACEN',
    'MOVIMIENTO_' || mi.tipo_movimiento,
    mi.tipo_movimiento || ' de inventario — Almacén: ' || al.nombre
        || COALESCE(' | ' || mi.referencia, '')
        || COALESCE(' | ' || LEFT(mi.observaciones, 60), ''),
    CASE WHEN mi.tipo_movimiento = 'AJUSTE'
         THEN 'WARNING'::"AuditSeveridad"
         ELSE 'INFO'::"AuditSeveridad"
    END,
    'MovimientoInventario',
    mi.movimiento_id::text,
    jsonb_build_object(
        'tipo',       mi.tipo_movimiento,
        'almacen',    al.nombre,
        'referencia', mi.referencia
    )
FROM movimiento_inventario mi
JOIN almacen al    ON al.almacen_id  = mi.almacen_id
JOIN usuario u     ON u.usuario_id   = mi.usuario_id
JOIN rol r         ON r.rol_id       = u.rol_id
ORDER BY mi.fecha_movimiento DESC
LIMIT 4;


-- ── CAJA: últimos pagos registrados ──────────────────────────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    pg.fecha_registro,
    pg.usuario_registro,
    COALESCE(u.email, 'caja@clinica'),
    COALESCE(r.nombre, 'CAJA'),
    'CAJA',
    CASE pg.estado_pago
        WHEN 'VALIDADO'  THEN 'PAGO_APROBADO'
        WHEN 'RECHAZADO' THEN 'PAGO_RECHAZADO'
        ELSE 'PAGO_REGISTRADO_' || pg.canal_pago
    END,
    'Pago ' || pg.canal_pago || ' de $' || ROUND(pg.monto::numeric, 2)
        || ' — Factura #' || pg.factura_id
        || ' (' || pg.estado_pago || ')',
    CASE WHEN pg.estado_pago = 'RECHAZADO'
         THEN 'WARNING'::"AuditSeveridad"
         ELSE 'INFO'::"AuditSeveridad"
    END,
    'Pago',
    pg.pago_id::text,
    jsonb_build_object(
        'monto',      pg.monto,
        'canal',      pg.canal_pago,
        'estado',     pg.estado_pago,
        'facturaId',  pg.factura_id
    )
FROM pago pg
JOIN usuario u ON u.usuario_id = pg.usuario_registro
JOIN rol r     ON r.rol_id     = u.rol_id
ORDER BY pg.fecha_registro DESC
LIMIT 3;


-- ── ENFERMERÍA: últimas solicitudes de consumo directo ───────
INSERT INTO registro_auditoria
    (fecha_hora, usuario_id, nombre_usuario, rol_usuario, modulo, accion, descripcion, severidad, entidad_tipo, entidad_id, metadatos)
SELECT
    si.fecha_solicitud,
    si.usuario_solicita,
    COALESCE(u.email, 'enfermeria@clinica'),
    COALESCE(r.nombre, 'ENFERMERIA'),
    'ENFERMERIA',
    'CONSUMO_INSUMO',
    'Consumo de insumos registrado por enfermería — Paciente: '
        || p.nombres || ' ' || p.apellidos,
    'INFO',
    'CitaMedica',
    si.cita_id::text,
    jsonb_build_object('paciente', p.nombres || ' ' || p.apellidos, 'observaciones', si.observaciones)
FROM solicitud_insumo si
JOIN cita_medica cm  ON cm.cita_id    = si.cita_id
JOIN paciente p      ON p.paciente_id = cm.paciente_id
JOIN usuario u       ON u.usuario_id  = si.usuario_solicita
JOIN rol r           ON r.rol_id      = u.rol_id
WHERE si.observaciones ILIKE '%Enfermer%' OR si.observaciones ILIKE '%consumo%'
ORDER BY si.fecha_solicitud DESC
LIMIT 2;

-- Verificar resultados
SELECT modulo, accion, severidad, descripcion, fecha_hora
FROM registro_auditoria
ORDER BY fecha_hora DESC;
