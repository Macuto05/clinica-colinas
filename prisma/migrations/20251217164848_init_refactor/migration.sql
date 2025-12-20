/*
  Warnings:

  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Doctor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Speciality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UsuarioEstado" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "PacienteEstado" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'FALLECIDO');

-- CreateEnum
CREATE TYPE "EmpleadoEstadoLaboral" AS ENUM ('ACTIVO', 'VACACIONES', 'LICENCIA', 'SUSPENDIDO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "CitaEstado" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "CitaOrigen" AS ENUM ('WEB', 'RECEPCION');

-- CreateEnum
CREATE TYPE "CitaTipo" AS ENUM ('CONSULTA', 'CONTROL', 'ESPECIALIDAD', 'OTRA');

-- CreateEnum
CREATE TYPE "FacturaEstado" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "FacturaItemTipo" AS ENUM ('SERVICIO', 'INSUMO', 'EXAMEN', 'OTRO');

-- CreateEnum
CREATE TYPE "PagoEstado" AS ENUM ('PENDIENTE', 'VALIDADO', 'RECHAZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "PagoCanal" AS ENUM ('ONLINE', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO');

-- CreateEnum
CREATE TYPE "SolicitudInsumoEstado" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'DESPACHADA');

-- CreateEnum
CREATE TYPE "SolicitudLabEstado" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'ATENDIDA');

-- CreateEnum
CREATE TYPE "DocumentoTipo" AS ENUM ('RESULTADO_LAB', 'INFORME', 'OTRO');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_specialityId_fkey";

-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_userId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_doctorId_fkey";

-- DropTable
DROP TABLE "Appointment";

-- DropTable
DROP TABLE "Doctor";

-- DropTable
DROP TABLE "Schedule";

-- DropTable
DROP TABLE "Speciality";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "usuario_id" BIGSERIAL NOT NULL,
    "rol_id" BIGINT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "estado" "UsuarioEstado" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMPTZ,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "empleado" (
    "empleado_id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "documento_identidad" VARCHAR(40),
    "telefono" VARCHAR(40),
    "correo_institucional" VARCHAR(255),
    "fecha_ingreso" DATE,
    "estado_laboral" "EmpleadoEstadoLaboral" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("empleado_id")
);

-- CreateTable
CREATE TABLE "medico" (
    "empleado_id" BIGINT NOT NULL,
    "especialidad" VARCHAR(120) NOT NULL,
    "numero_colegiatura" VARCHAR(60),
    "licencia_profesional" VARCHAR(60),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "medico_pkey" PRIMARY KEY ("empleado_id")
);

-- CreateTable
CREATE TABLE "paciente" (
    "paciente_id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "documento_identidad" VARCHAR(40),
    "fecha_nacimiento" DATE,
    "sexo" VARCHAR(20),
    "telefono" VARCHAR(40),
    "correo" VARCHAR(255),
    "direccion" TEXT,
    "estado" "PacienteEstado" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("paciente_id")
);

-- CreateTable
CREATE TABLE "cita_medica" (
    "cita_id" BIGSERIAL NOT NULL,
    "paciente_id" BIGINT NOT NULL,
    "medico_id" BIGINT NOT NULL,
    "fecha_cita" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "motivo_consulta" TEXT,
    "estado_cita" "CitaEstado" NOT NULL DEFAULT 'PROGRAMADA',
    "tipo_cita" "CitaTipo" NOT NULL DEFAULT 'CONSULTA',
    "origen_cita" "CitaOrigen" NOT NULL DEFAULT 'WEB',
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" BIGINT NOT NULL,

    CONSTRAINT "cita_medica_pkey" PRIMARY KEY ("cita_id")
);

-- CreateTable
CREATE TABLE "metodo_pago" (
    "metodo_pago_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "metodo_pago_pkey" PRIMARY KEY ("metodo_pago_id")
);

-- CreateTable
CREATE TABLE "factura" (
    "factura_id" BIGSERIAL NOT NULL,
    "cita_id" BIGINT NOT NULL,
    "numero_factura" VARCHAR(60),
    "fecha_emision" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_factura" "FacturaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "usuario_emision" BIGINT NOT NULL,

    CONSTRAINT "factura_pkey" PRIMARY KEY ("factura_id")
);

-- CreateTable
CREATE TABLE "factura_detalle" (
    "detalle_id" BIGSERIAL NOT NULL,
    "factura_id" BIGINT NOT NULL,
    "tipo_item" "FacturaItemTipo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "referencia_id" BIGINT,

    CONSTRAINT "factura_detalle_pkey" PRIMARY KEY ("detalle_id")
);

-- CreateTable
CREATE TABLE "pago" (
    "pago_id" BIGSERIAL NOT NULL,
    "factura_id" BIGINT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_pago" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_pago" "PagoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "metodo_pago_id" BIGINT NOT NULL,
    "referencia_externa" VARCHAR(120),
    "canal_pago" "PagoCanal" NOT NULL DEFAULT 'PRESENCIAL',
    "usuario_registro" BIGINT NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("pago_id")
);

-- CreateTable
CREATE TABLE "insumo" (
    "insumo_id" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" VARCHAR(40) NOT NULL,
    "categoria" VARCHAR(60) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "insumo_pkey" PRIMARY KEY ("insumo_id")
);

-- CreateTable
CREATE TABLE "almacen" (
    "almacen_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "almacen_pkey" PRIMARY KEY ("almacen_id")
);

-- CreateTable
CREATE TABLE "stock" (
    "stock_id" BIGSERIAL NOT NULL,
    "almacen_id" BIGINT NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad_actual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actualizado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "proveedor_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "rif_nif" VARCHAR(40),
    "telefono" VARCHAR(40),
    "correo" VARCHAR(255),
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("proveedor_id")
);

-- CreateTable
CREATE TABLE "solicitud_insumo" (
    "solicitud_insumo_id" BIGSERIAL NOT NULL,
    "cita_id" BIGINT NOT NULL,
    "usuario_solicita" BIGINT NOT NULL,
    "fecha_solicitud" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_solicitud" "SolicitudInsumoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "usuario_responde" BIGINT,
    "fecha_respuesta" TIMESTAMPTZ,
    "observaciones" TEXT,

    CONSTRAINT "solicitud_insumo_pkey" PRIMARY KEY ("solicitud_insumo_id")
);

-- CreateTable
CREATE TABLE "solicitud_insumo_detalle" (
    "solicitud_detalle_id" BIGSERIAL NOT NULL,
    "solicitud_insumo_id" BIGINT NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad_solicitada" DECIMAL(14,2) NOT NULL,
    "cantidad_aprobada" DECIMAL(14,2),

    CONSTRAINT "solicitud_insumo_detalle_pkey" PRIMARY KEY ("solicitud_detalle_id")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "movimiento_id" BIGSERIAL NOT NULL,
    "almacen_id" BIGINT NOT NULL,
    "tipo_movimiento" "MovimientoTipo" NOT NULL,
    "fecha_movimiento" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" BIGINT NOT NULL,
    "proveedor_id" BIGINT,
    "solicitud_insumo_id" BIGINT,
    "referencia" VARCHAR(120),
    "observaciones" TEXT,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("movimiento_id")
);

-- CreateTable
CREATE TABLE "movimiento_detalle" (
    "movimiento_detalle_id" BIGSERIAL NOT NULL,
    "movimiento_id" BIGINT NOT NULL,
    "insumo_id" BIGINT NOT NULL,
    "cantidad" DECIMAL(14,2) NOT NULL,
    "costo_unitario" DECIMAL(14,2),

    CONSTRAINT "movimiento_detalle_pkey" PRIMARY KEY ("movimiento_detalle_id")
);

-- CreateTable
CREATE TABLE "examen_laboratorio" (
    "examen_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "examen_laboratorio_pkey" PRIMARY KEY ("examen_id")
);

-- CreateTable
CREATE TABLE "solicitud_laboratorio" (
    "solicitud_lab_id" BIGSERIAL NOT NULL,
    "cita_id" BIGINT NOT NULL,
    "usuario_solicita" BIGINT NOT NULL,
    "fecha_solicitud" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_solicitud" "SolicitudLabEstado" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,

    CONSTRAINT "solicitud_laboratorio_pkey" PRIMARY KEY ("solicitud_lab_id")
);

-- CreateTable
CREATE TABLE "solicitud_laboratorio_detalle" (
    "detalle_lab_id" BIGSERIAL NOT NULL,
    "solicitud_lab_id" BIGINT NOT NULL,
    "examen_id" BIGINT NOT NULL,

    CONSTRAINT "solicitud_laboratorio_detalle_pkey" PRIMARY KEY ("detalle_lab_id")
);

-- CreateTable
CREATE TABLE "resultado_laboratorio" (
    "resultado_id" BIGSERIAL NOT NULL,
    "detalle_lab_id" BIGINT NOT NULL,
    "fecha_resultado" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion_general" TEXT,
    "usuario_carga" BIGINT NOT NULL,

    CONSTRAINT "resultado_laboratorio_pkey" PRIMARY KEY ("resultado_id")
);

-- CreateTable
CREATE TABLE "documento_clinico" (
    "documento_id" BIGSERIAL NOT NULL,
    "resultado_id" BIGINT NOT NULL,
    "cita_id" BIGINT NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tipo_documento" "DocumentoTipo" NOT NULL DEFAULT 'RESULTADO_LAB',
    "fecha_carga" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_clinico_pkey" PRIMARY KEY ("documento_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleado_usuario_id_key" ON "empleado"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleado_documento_identidad_key" ON "empleado"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "medico_numero_colegiatura_key" ON "medico"("numero_colegiatura");

-- CreateIndex
CREATE UNIQUE INDEX "medico_licencia_profesional_key" ON "medico"("licencia_profesional");

-- CreateIndex
CREATE UNIQUE INDEX "paciente_usuario_id_key" ON "paciente"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "paciente_documento_identidad_key" ON "paciente"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "cita_medica_medico_id_fecha_cita_hora_inicio_key" ON "cita_medica"("medico_id", "fecha_cita", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_pago_nombre_key" ON "metodo_pago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "factura_cita_id_key" ON "factura"("cita_id");

-- CreateIndex
CREATE UNIQUE INDEX "factura_numero_factura_key" ON "factura"("numero_factura");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_codigo_key" ON "insumo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "almacen_nombre_key" ON "almacen"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "stock_almacen_id_insumo_id_key" ON "stock"("almacen_id", "insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_rif_nif_key" ON "proveedor"("rif_nif");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_insumo_detalle_solicitud_insumo_id_insumo_id_key" ON "solicitud_insumo_detalle"("solicitud_insumo_id", "insumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "examen_laboratorio_nombre_key" ON "examen_laboratorio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_laboratorio_detalle_solicitud_lab_id_examen_id_key" ON "solicitud_laboratorio_detalle"("solicitud_lab_id", "examen_id");

-- CreateIndex
CREATE UNIQUE INDEX "resultado_laboratorio_detalle_lab_id_key" ON "resultado_laboratorio"("detalle_lab_id");

-- CreateIndex
CREATE UNIQUE INDEX "documento_clinico_resultado_id_key" ON "documento_clinico"("resultado_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medico" ADD CONSTRAINT "medico_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleado"("empleado_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_medica" ADD CONSTRAINT "cita_medica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("paciente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_medica" ADD CONSTRAINT "cita_medica_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medico"("empleado_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_medica" ADD CONSTRAINT "cita_medica_usuario_creacion_fkey" FOREIGN KEY ("usuario_creacion") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "cita_medica"("cita_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_usuario_emision_fkey" FOREIGN KEY ("usuario_emision") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura_detalle" ADD CONSTRAINT "factura_detalle_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "factura"("factura_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "factura"("factura_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodo_pago"("metodo_pago_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_usuario_registro_fkey" FOREIGN KEY ("usuario_registro") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacen"("almacen_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo"("insumo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_insumo" ADD CONSTRAINT "solicitud_insumo_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "cita_medica"("cita_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_insumo" ADD CONSTRAINT "solicitud_insumo_usuario_solicita_fkey" FOREIGN KEY ("usuario_solicita") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_insumo" ADD CONSTRAINT "solicitud_insumo_usuario_responde_fkey" FOREIGN KEY ("usuario_responde") REFERENCES "usuario"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_insumo_detalle" ADD CONSTRAINT "solicitud_insumo_detalle_solicitud_insumo_id_fkey" FOREIGN KEY ("solicitud_insumo_id") REFERENCES "solicitud_insumo"("solicitud_insumo_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_insumo_detalle" ADD CONSTRAINT "solicitud_insumo_detalle_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo"("insumo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacen"("almacen_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("proveedor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_solicitud_insumo_id_fkey" FOREIGN KEY ("solicitud_insumo_id") REFERENCES "solicitud_insumo"("solicitud_insumo_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_detalle" ADD CONSTRAINT "movimiento_detalle_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimiento_inventario"("movimiento_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_detalle" ADD CONSTRAINT "movimiento_detalle_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo"("insumo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_laboratorio" ADD CONSTRAINT "solicitud_laboratorio_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "cita_medica"("cita_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_laboratorio" ADD CONSTRAINT "solicitud_laboratorio_usuario_solicita_fkey" FOREIGN KEY ("usuario_solicita") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_laboratorio_detalle" ADD CONSTRAINT "solicitud_laboratorio_detalle_solicitud_lab_id_fkey" FOREIGN KEY ("solicitud_lab_id") REFERENCES "solicitud_laboratorio"("solicitud_lab_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_laboratorio_detalle" ADD CONSTRAINT "solicitud_laboratorio_detalle_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examen_laboratorio"("examen_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultado_laboratorio" ADD CONSTRAINT "resultado_laboratorio_detalle_lab_id_fkey" FOREIGN KEY ("detalle_lab_id") REFERENCES "solicitud_laboratorio_detalle"("detalle_lab_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultado_laboratorio" ADD CONSTRAINT "resultado_laboratorio_usuario_carga_fkey" FOREIGN KEY ("usuario_carga") REFERENCES "usuario"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_clinico" ADD CONSTRAINT "documento_clinico_resultado_id_fkey" FOREIGN KEY ("resultado_id") REFERENCES "resultado_laboratorio"("resultado_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_clinico" ADD CONSTRAINT "documento_clinico_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "cita_medica"("cita_id") ON DELETE RESTRICT ON UPDATE CASCADE;
