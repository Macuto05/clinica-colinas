-- 1. Create Role
INSERT INTO "rol" (nombre, descripcion, activo)
VALUES ('CAJA', 'Encargado de caja y facturación', true)
ON CONFLICT (nombre) DO NOTHING;

-- 2. Create User (password: 123456)
INSERT INTO "usuario" (rol_id, email, password_hash, estado, fecha_creacion)
VALUES (
    (SELECT rol_id FROM "rol" WHERE nombre = 'CAJA'),
    'caja@clinica.com',
    '$2b$10$/tbZmluhmWs66Q/p9wwBkOCpggQ03NEWjS5mwDBJRn5i3TWg8RgGa',
    'ACTIVO', -- Enum 'UsuarioEstado'
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Create Employee Profile
INSERT INTO "empleado" (usuario_id, nombres, apellidos, documento_identidad, fecha_ingreso, estado_laboral)
VALUES (
    (SELECT usuario_id FROM "usuario" WHERE email = 'caja@clinica.com'),
    'Cajero',
    'Principal',
    'V11122233',
    NOW(),
    'ACTIVO' -- Enum 'EmpleadoEstadoLaboral'
)
ON CONFLICT (usuario_id) DO NOTHING;
