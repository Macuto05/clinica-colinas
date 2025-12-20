# Clean Architecture - Sistema de Clínica

Este documento describe la implementación de **Clean Architecture** (Arquitectura Limpia) en el proyecto del sistema de gestión de clínica.

## 📚 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura de Capas](#estructura-de-capas)
3. [Principios Fundamentales](#principios-fundamentales)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Flujo de Datos](#flujo-de-datos)
6. [Convenciones de Código](#convenciones-de-código)
7. [Guía de Desarrollo](#guía-de-desarrollo)

---

## Visión General

Clean Architecture es un patrón arquitectónico que separa el código en capas concéntricas, donde las dependencias apuntan **siempre hacia adentro** (hacia el centro). Esto hace que el sistema sea:

- ✅ **Independiente de frameworks** - Next.js es solo un detalle de entrega
- ✅ **Testeable** - La lógica de negocio está completamente aislada
- ✅ **Independiente de UI** - Puedes cambiar React por otro framework
- ✅ **Independiente de BD** - Prisma es solo un detalle de implementación
- ✅ **Mantenible** - Cambios en una capa no afectan a las demás

## Estructura de Capas

```
┌──────────────────────────────────────┐
│     4. PRESENTATION (UI/API)         │  ← Next.js, React, API Routes
├──────────────────────────────────────┤
│     3. INFRASTRUCTURE                │  ← Prisma, HTTP, External Services
├──────────────────────────────────────┤
│     2. APPLICATION (Use Cases)       │  ← Business Logic
├──────────────────────────────────────┤
│     1. DOMAIN (Entities)             │  ← Core Business Rules
└──────────────────────────────────────┘
       ↑                     ↑
       └──── Dependencies ───┘
         (always point inward)
```

### Capa 1: Domain (Dominio)

**Ruta**: `src/domain/`

La capa más interna. Contiene las **reglas de negocio empresariales** puras.

- **Entidades**: Objetos de negocio con identidad (`User`, `Doctor`, `Appointment`)
- **Value Objects**: Objetos sin identidad (`Email`)
- **Interfaces de Repositorios**: Contratos para persistencia de datos

**Características**:
- ❌ No depende de NADA externo
- ❌ No importa frameworks, librerías, o BD
- ✅ Solo TypeScript puro
- ✅ Contiene validaciones de negocio

**Ejemplo**:

```typescript
// src/domain/entities/Appointment.ts
export class Appointment {
  // Regla de negocio: No se puede cancelar una cita completada
  cancel(): Appointment {
    if (this.isCompleted()) {
      throw new Error('Cannot cancel a completed appointment');
    }
    // ...
  }
}
```

### Capa 2: Application (Aplicación)

**Ruta**: `src/application/`

Contiene los **casos de uso** de la aplicación (lo que el usuario puede hacer).

- **Use Cases**: Orquestación de la lógica de negocio
- **DTOs**: Data Transfer Objects para entrada/salida

**Características**:
- ✅ Depende solo de Domain
- ✅ Usa interfaces de repositorios (no implementaciones)
- ✅ Coordina entidades para completar tareas
- ❌ No conoce frameworks ni BD

**Ejemplo**:

```typescript
// src/application/use-cases/appointment/ScheduleAppointment.ts
export class ScheduleAppointment {
  constructor(
    private appointmentRepo: IAppointmentRepository, // Interface, not implementation!
    private userRepo: IUserRepository,
    private doctorRepo: IDoctorRepository
  ) {}

  async execute(data: CreateAppointmentDTO): Promise<Appointment> {
    // 1. Validar que paciente existe
    const patient = await this.userRepo.findById(data.patientId);
    // 2. Validar que doctor existe
    const doctor = await this.doctorRepo.findById(data.doctorId);
    // 3. Verificar disponibilidad
    const isAvailable = await this.appointmentRepo.isTimeSlotAvailable(...);
    // 4. Crear entidad
    const appointment = new Appointment({ ... });
    // 5. Persistir
    return await this.appointmentRepo.create(appointment);
  }
}
```

### Capa 3: Infrastructure (Infraestructura)

**Ruta**: `src/infrastructure/`

Implementaciones concretas de las interfaces definidas en Domain.

- **Repositorios Prisma**: Implementaciones de `IUserRepository`, etc.
- **Controladores HTTP**: Manejan requests HTTP
- **Servicios Externos**: Email, n8n, etc.
- **DI Container**: Inyección de dependencias

**Características**:
- ✅ Implementa interfaces de Domain
- ✅ Conoce frameworks y librerías externas
- ✅ Traduce entre dominio y tecnologías externas

**Ejemplo**:

```typescript
// src/infrastructure/database/prisma/repositories/PrismaUserRepository.ts
export class PrismaUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        // ...
      },
    });

    // Convierte de Prisma Model a Domain Entity
    return new User({ ...created });
  }
}
```

### Capa 4: Presentation (Presentación)

**Ruta**: `src/app/` (Next.js App Router)

La UI React y las rutas de API de Next.js.

- **Páginas**: Next.js pages
- **Componentes React**: UI components
- **API Routes**: Endpoints HTTP
- **Hooks**: Custom React hooks

**Características**:
- ✅ Usa controladores de Infrastructure
- ✅ Maneja estado de UI
- ✅ No contiene lógica de negocio

**Ejemplo**:

```typescript
// src/app/api/auth/register/route.ts
import { authController } from '@/infrastructure/http/controllers/AuthController';

export async function POST(request: Request) {
  return authController.register(request);
}
```

---

## Estructura del Proyecto

```
src/
├── domain/                           # CAPA 1: Núcleo del negocio
│   ├── entities/
│   │   ├── User.ts                   # Entidad de usuario
│   │   ├── Doctor.ts
│   │   ├── Appointment.ts
│   │   ├── Speciality.ts
│   │   └── Schedule.ts
│   ├── value-objects/
│   │   └── Email.ts                  # Value Object para emails
│   └── repositories/                 # Interfaces (contratos)
│       ├── IUserRepository.ts
│       ├── IDoctorRepository.ts
│       ├── IAppointmentRepository.ts
│       ├── ISpecialityRepository.ts
│       └── IScheduleRepository.ts
│
├── application/                      # CAPA 2: Casos de Uso
│   ├── use-cases/
│   │   ├── auth/
│   │   │   ├── RegisterUser.ts
│   │   │   └── LoginUser.ts
│   │   ├── patient/
│   │   │   ├── GetUserProfile.ts
│   │   │   └── UpdateUserProfile.ts
│   │   ├── appointment/
│   │   │   ├── ScheduleAppointment.ts
│   │   │   ├── CancelAppointment.ts
│   │   │   ├── GetAppointmentsByPatient.ts
│   │   │   └── GetAppointmentsByDoctor.ts
│   │   └── doctor/
│   │       ├── GetDoctorsBySpeciality.ts
│   │       └── GetDoctorAvailability.ts
│   └── dto/
│       ├── RegisterUserDTO.ts
│       ├── LoginUserDTO.ts
│       ├── CreateAppointmentDTO.ts
│       └── UpdateUserProfileDTO.ts
│
├── infrastructure/                   # CAPA 3: Implementaciones
│   ├── database/
│   │   └── prisma/
│   │       ├── client.ts             # Prisma Client singleton
│   │       └── repositories/
│   │           ├── PrismaUserRepository.ts
│   │           ├── PrismaDoctorRepository.ts
│   │           ├── PrismaAppointmentRepository.ts
│   │           ├── PrismaSpecialityRepository.ts
│   │           └── PrismaScheduleRepository.ts
│   ├── http/
│   │   └── controllers/
│   │       ├── AuthController.ts
│   │       ├── AppointmentController.ts
│   │       └── DoctorController.ts
│   ├── services/
│   │   └── JWTService.ts
│   └── di/
│       └── DIContainer.ts            # Dependency Injection
│
└── app/                              # CAPA 4: Next.js (Presentación)
    ├── api/                          # API Routes
    │   ├── auth/
    │   │   ├── register/route.ts
    │   │   └── login/route.ts
    │   ├── appointments/
    │   │   ├── route.ts
    │   │   └── [id]/cancel/route.ts
    │   └── doctors/
    │       ├── route.ts
    │       └── [id]/availability/route.ts
    ├── (pages)/                      # Páginas de la app
    └── components/                   # Componentes React
```

---

## Flujo de Datos

### Ejemplo: Registro de Usuario

```
1. Usuario llena formulario de registro
   ↓
2. [PRESENTATION] POST /api/auth/register
   ↓
3. [INFRASTRUCTURE] AuthController.register()
   ↓
4. [APPLICATION] RegisterUser.execute(dto)
   ├─→ Valida email único (vía IUserRepository)
   ├─→ Hashea contraseña
   ├─→ Crea User entity (validaciones de dominio)
   └─→ Persiste usando repository
   ↓
5. [INFRASTRUCTURE] PrismaUserRepository.create()
   ├─→ Guarda en PostgreSQL
   └─→ Convierte Prisma Model → Domain Entity
   ↓
6. [INFRASTRUCTURE] AuthController genera JWT
   ↓
7. [PRESENTATION] Retorna { user, token } al cliente
```

### Regla de Dependencias

```
Presentation → Infrastructure → Application → Domain
    ❌         →      ❌        →     ❌      →   ✅
```

- ✅ **Domain** NO depende de nadie
- ✅ **Application** solo depende de Domain
- ✅ **Infrastructure** depende de Domain y Application
- ✅ **Presentation** depende de Infrastructure

---

## Convenciones de Código

### 1. Importaciones

Usa **path aliases** configurados en `tsconfig.json`:

```typescript
// ✅ CORRECTO
import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

// ❌ INCORRECTO
import { User } from '../../../domain/entities/User';
```

### 2. Naming Conventions

- **Entities**: PascalCase, singular (`User`, `Appointment`)
- **Use Cases**: PascalCase, verbo + sustantivo (`RegisterUser`, `ScheduleAppointment`)
- **Repositories**: `Prisma` + Entity + `Repository` (`PrismaUserRepository`)
- **Controllers**: Entity + `Controller` (`AuthController`)
- **DTOs**: Purpose + `DTO` (`RegisterUserDTO`)

### 3. Estructura de Archivos

Cada entidad/use case en su propio archivo:

```
✅ RegisterUser.ts
✅ LoginUser.ts

❌ auth.ts (con RegisterUser y LoginUser juntos)
```

### 4. Exportaciones

```typescript
// Exports named
export class RegisterUser { ... }

// No default exports para clases de dominio/aplicación
```

---

## Guía de Desarrollo

### Agregar un Nuevo Caso de Uso

**Ejemplo**: Crear caso de uso "Confirmar Cita"

#### Paso 1: Verificar si existe en Domain

¿La entidad `Appointment` tiene el método `.confirm()`?

```typescript
// src/domain/entities/Appointment.ts
confirm(): Appointment {
  if (this.isCancelled()) {
    throw new Error('Cannot confirm a cancelled appointment');
  }
  // ...
}
```

Si no existe, agrégalo primero.

#### Paso 2: Crear el Use Case

```typescript
// src/application/use-cases/appointment/ConfirmAppointment.ts
import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class ConfirmAppointment {
  constructor(private appointmentRepo: IAppointmentRepository) {}

  async execute(appointmentId: number, doctorId: number): Promise<Appointment> {
    // 1. Obtener cita
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // 2. Verificar que el doctor tenga permiso
    if (appointment.doctorId !== doctorId) {
      throw new Error('Unauthorized');
    }

    // 3. Usar lógica de dominio
    const confirmed = appointment.confirm();

    // 4. Persistir
    return await this.appointmentRepo.update(appointmentId, confirmed);
  }
}
```

#### Paso 3: Registrar en DI Container

```typescript
// src/infrastructure/di/DIContainer.ts
getConfirmAppointmentUseCase(): ConfirmAppointment {
  return new ConfirmAppointment(this.appointmentRepository);
}
```

#### Paso 4: Crear endpoint en Controller

```typescript
// src/infrastructure/http/controllers/AppointmentController.ts
async confirm(appointmentId: number, doctorId: number): Promise<NextResponse> {
  try {
    const confirmUseCase = container.getConfirmAppointmentUseCase();
    const appointment = await confirmUseCase.execute(appointmentId, doctorId);
    return NextResponse.json(appointment.toJSON());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

#### Paso 5: Crear API Route

```typescript
// src/app/api/appointments/[id]/confirm/route.ts
import { appointmentController } from '@/infrastructure/http/controllers/AppointmentController';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { doctorId } = await request.json();
  return appointmentController.confirm(parseInt(params.id), doctorId);
}
```

### Agregar un Nuevo Repositorio

Si necesitas agregar un nuevo modelo (ej: `MedicalRecord`):

1. **Domain**: Crear `src/domain/entities/MedicalRecord.ts`
2. **Domain**: Crear `src/domain/repositories/IMedicalRecordRepository.ts`
3. **Infrastructure**: Implementar `src/infrastructure/database/prisma/repositories/PrismaMedicalRecordRepository.ts`
4. **Infrastructure**: Registrar en `DIContainer.ts`

### Testing

Con esta arquitectura, puedes testear fácilmente:

```typescript
// Ejemplo: Test de RegisterUser use case
describe('RegisterUser', () => {
  it('should register a new user', async () => {
    // Mock del repository
    const mockRepo = {
      emailExists: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockResolvedValue(mockUser),
    };

    // Instancia del use case con mock
    const useCase = new RegisterUser(mockRepo as any);

    // Ejecutar
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    // Verificar
    expect(mockRepo.emailExists).toHaveBeenCalledWith('john@example.com');
    expect(result.name).toBe('John Doe');
  });
});
```

---

## Beneficios de Clean Architecture

1. **Testeable**: Puedes testear lógica de negocio sin BD ni frameworks
2. **Flexible**: Cambiar de Prisma a TypeORM solo afecta Infrastructure
3. **Mantenible**: Cambios aislados a capas específicas
4. **Escalable**: Fácil agregar nuevos features siguiendo el mismo patrón
5. **Comprensible**: Estructura clara y predecible

---

## Recursos Adicionales

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [The Dependency Rule](https://khalilstemmler.com/articles/software-design-architecture/organizing-app-logic/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

**Fecha de Actualización**: Diciembre 2025  
**Versión**: 1.0.0
