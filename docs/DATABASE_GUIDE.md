# Guía Completa de Base de Datos - Sistema de Clínica

## 📊 Resumen General

Tu base de datos tiene **5 tablas principales** que representan el sistema de gestión de la clínica:

1. **User** (Usuarios) - Pacientes, doctores, admin, etc.
2. **Doctor** (Doctores) - Información específica de médicos
3. **Speciality** (Especialidades) - Cardiología, Pediatría, etc.
4. **Schedule** (Horarios) - Disponibilidad de los doctores
5. **Appointment** (Citas) - Citas médicas agendadas

---

## 🔗 Diagrama de Relaciones

```
┌─────────────────┐
│      USER       │
│  (Usuarios)     │
├─────────────────┤
│ id              │◄────┐
│ name            │     │
│ email           │     │ Un usuario puede ser
│ password        │     │ paciente O doctor
│ role            │     │
│ phone?          │     │
│ address?        │     │
└─────────────────┘     │
        │               │
        │ 1:N           │ 1:1
        │               │
        ▼               │
┌─────────────────┐     │
│  APPOINTMENT    │     │
│    (Citas)      │     │
├─────────────────┤     │
│ id              │     │
│ patientId       │─────┘ (FK a User)
│ doctorId        │─────┐ (FK a Doctor)
│ date            │     │
│ time            │     │
│ duration        │     │
│ status          │     │
│ reason?         │     │
│ notes?          │     │
└─────────────────┘     │
                        │
                        │ N:1
                        │
                        ▼
                ┌─────────────────┐
                │     DOCTOR      │
                │   (Doctores)    │
                ├─────────────────┤
                │ id              │
                │ userId          │─────► (FK a User)
                │ specialityId    │─────┐ (FK a Speciality)
                │ license         │     │
                │ biography?      │     │
                └─────────────────┘     │
                        │               │
                        │ 1:N           │ N:1
                        │               │
                        ▼               ▼
                ┌─────────────────┐ ┌─────────────────┐
                │    SCHEDULE     │ │   SPECIALITY    │
                │   (Horarios)    │ │ (Especialidades)│
                ├─────────────────┤ ├─────────────────┤
                │ id              │ │ id              │
                │ doctorId        │ │ name            │
                │ dayOfWeek       │ │ description?    │
                │ startTime       │ │ icon?           │
                │ endTime         │ └─────────────────┘
                │ isAvailable     │
                └─────────────────┘
```

---

## 📋 Detalle de Cada Tabla

### 1️⃣ Tabla: `User` (Usuarios)

**Propósito:** Almacena TODOS los usuarios del sistema (pacientes, doctores, admin, enfermeras, etc.)

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Int | ID único (autoincremental) | 1, 2, 3... |
| `name` | String | Nombre completo | "Juan Pérez" |
| `email` | String | Email (único) | "juan@email.com" |
| `password` | String | Contraseña hasheada | "$2a$10$..." |
| `role` | Enum | Rol del usuario | PATIENT, DOCTOR, ADMIN, NURSE, LAB, INVENTORY |
| `phone` | String? | Teléfono (opcional) | "+58 412-123-4567" |
| `address` | String? | Dirección (opcional) | "Av. Universidad, Barcelona" |
| `createdAt` | DateTime | Fecha de registro | 2024-12-06T10:30:00Z |
| `updatedAt` | DateTime | Última actualización | 2024-12-06T14:20:00Z |

**Roles Disponibles:**
- `PATIENT` - Pacientes comunes
- `DOCTOR` - Médicos
- `ADMIN` - Administradores del sistema
- `NURSE` - Enfermeras
- `LAB` - Personal de laboratorio
- `INVENTORY` - Control de inventario

**Relaciones:**
- Un `User` con rol `DOCTOR` puede tener **1 Doctor** (relación 1:1)
- Un `User` con rol `PATIENT` puede tener **muchas Appointment** (relación 1:N)

---

### 2️⃣ Tabla: `Doctor` (Doctores)

**Propósito:** Información adicional SOLO para usuarios que son doctores.

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Int | ID único | 1, 2, 3... |
| `userId` | Int | ID del User (único) | 5 |
| `specialityId` | Int | ID de la especialidad | 2 |
| `license` | String | Número de licencia médica | "MPPS-12345" |
| `biography` | String? | Biografía del doctor | "15 años de experiencia..." |
| `createdAt` | DateTime | Fecha de creación | 2024-12-06T10:30:00Z |
| `updatedAt` | DateTime | Última actualización | 2024-12-06T14:20:00Z |

**Relaciones:**
- Pertenece a **1 User** (el usuario que es doctor)
- Pertenece a **1 Speciality** (su especialidad médica)
- Puede tener **muchos Schedule** (múltiples horarios)
- Puede tener **muchas Appointment** (múltiples citas)

**Ejemplo de Flujo:**
```
1. Se registra un usuario: User { name: "Dra. María", role: "DOCTOR" }
2. Se crea su perfil de doctor: Doctor { userId: 1, specialityId: 2, license: "MPPS-12345" }
```

---

### 3️⃣ Tabla: `Speciality` (Especialidades)

**Propósito:** Catálogo de especialidades médicas disponibles en la clínica.

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Int | ID único | 1, 2, 3... |
| `name` | String | Nombre de la especialidad | "Cardiología" |
| `description` | String? | Descripción | "Especialidad del corazón..." |
| `icon` | String? | Ícono/Imagen | "cardiology.svg" |
| `createdAt` | DateTime | Fecha de creación | 2024-12-06 |
| `updatedAt` | DateTime | Última actualización | 2024-12-06 |

**Relaciones:**
- Puede tener **muchos Doctor** (muchos doctores en esa especialidad)

**Ejemplos de Especialidades:**
```sql
1. Cardiología
2. Pediatría
3. Dermatología
4. Traumatología
5. Ginecología
6. Oftalmología
7. Neurología
8. Medicina General
```

---

### 4️⃣ Tabla: `Schedule` (Horarios)

**Propósito:** Define la disponibilidad semanal de cada doctor.

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Int | ID único | 1, 2, 3... |
| `doctorId` | Int | ID del doctor | 1 |
| `dayOfWeek` | Int | Día de la semana (0-6) | 1 (Lunes) |
| `startTime` | String | Hora de inicio | "08:00" |
| `endTime` | String | Hora de fin | "12:00" |
| `isAvailable` | Boolean | Está disponible? | true |
| `createdAt` | DateTime | Fecha de creación | 2024-12-06 |
| `updatedAt` | DateTime | Última actualización | 2024-12-06 |

**Días de la Semana:**
- `0` = Domingo
- `1` = Lunes
- `2` = Martes
- `3` = Miércoles
- `4` = Jueves
- `5` = Viernes
- `6` = Sábado

**Ejemplo Real:**
```
Dr. Carlos (doctorId: 1) trabaja:
- Lunes (1): 08:00 - 12:00
- Lunes (1): 14:00 - 18:00
- Miércoles (3): 08:00 - 12:00
- Viernes (5): 14:00 - 18:00
```

**Relaciones:**
- Pertenece a **1 Doctor**

---

### 5️⃣ Tabla: `Appointment` (Citas)

**Propósito:** Almacena todas las citas médicas del sistema.

**Campos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Int | ID único | 1, 2, 3... |
| `patientId` | Int | ID del paciente (User) | 10 |
| `doctorId` | Int | ID del doctor | 1 |
| `date` | DateTime | Fecha de la cita | 2024-12-10 |
| `time` | String | Hora de la cita | "10:00" |
| `duration` | Int | Duración en minutos | 30 |
| `status` | Enum | Estado de la cita | PENDING, CONFIRMED, CANCELLED, COMPLETED |
| `reason` | String? | Motivo de consulta | "Dolor de cabeza" |
| `notes` | String? | Notas del doctor | "Paciente presenta..." |
| `createdAt` | DateTime | Fecha de creación | 2024-12-06 |
| `updatedAt` | DateTime | Última actualización | 2024-12-06 |

**Estados Posibles:**
- `PENDING` - Cita solicitada, esperando confirmación
- `CONFIRMED` - Cita confirmada
- `CANCELLED` - Cita cancelada
- `COMPLETED` - Cita realizada

**Relaciones:**
- Pertenece a **1 User** (el paciente)
- Pertenece a **1 Doctor**

**Ejemplo de Flujo:**
```
1. Paciente "Juan" (userId: 10) solicita cita
2. Con Dr. Carlos (doctorId: 1)
3. Para el 10 de Diciembre a las 10:00
4. Duración: 30 minutos
5. Estado inicial: PENDING
6. Doctor confirma → Estado: CONFIRMED
7. Cita se realiza → Estado: COMPLETED
```

---

## 🔄 Flujos de Datos Comunes

### Flujo 1: Registrar un Paciente

```sql
-- 1. Crear usuario
INSERT INTO User (name, email, password, role)
VALUES ('Juan Pérez', 'juan@email.com', '$2a$...', 'PATIENT');
```

### Flujo 2: Registrar un Doctor

```sql
-- 1. Crear usuario
INSERT INTO User (name, email, password, role)
VALUES ('Dra. María Gómez', 'maria@clinica.com', '$2a$...', 'DOCTOR');

-- 2. Crear perfil de doctor
INSERT INTO Doctor (userId, specialityId, license)
VALUES (5, 2, 'MPPS-12345');

-- 3. Definir horarios
INSERT INTO Schedule (doctorId, dayOfWeek, startTime, endTime)
VALUES (1, 1, '08:00', '12:00'),  -- Lunes mañana
       (1, 1, '14:00', '18:00');  -- Lunes tarde
```

### Flujo 3: Agendar una Cita

```sql
-- 1. Verificar disponibilidad del doctor
SELECT * FROM Schedule 
WHERE doctorId = 1 AND dayOfWeek = 1 AND isAvailable = true;

-- 2. Verificar que no haya otra cita a esa hora
SELECT * FROM Appointment 
WHERE doctorId = 1 AND date = '2024-12-10' AND time = '10:00';

-- 3. Si está disponible, crear cita
INSERT INTO Appointment (patientId, doctorId, date, time, duration, status)
VALUES (10, 1, '2024-12-10', '10:00', 30, 'PENDING');
```

---

## 🎯 Datos Iniciales Recomendados

Para que tu sistema funcione, necesitas crear datos iniciales:

### 1. Especialidades (8-10 básicas)
```
1. Medicina General
2. Cardiología
3. Pediatría
4. Ginecología
5. Traumatología
6. Dermatología
7. Oftalmología
8. Neurología
```

### 2. Al menos 1 Admin
```
email: admin@clinica.com
password: Admin123! (hasheada)
role: ADMIN
```

### 3. Doctores de Ejemplo (3-5)
```
- Dr. Carlos Rodríguez (Cardiología)
- Dra. Ana Martínez (Pediatría)
- Dr. Luis Fernández (Traumatología)
```

### 4. Horarios para cada Doctor

---

## 📝 Próximos Pasos

Te voy a crear un **script de seed** que popule la base de datos con datos de ejemplo para que puedas probar el sistema.

¿Quieres que:
1. **Cree el script de seed** con datos de ejemplo?
2. **Continuemos con la landing page** ya con este entendimiento?
3. **Ambas cosas?**

Dime qué prefieres y continuamos! 😊
