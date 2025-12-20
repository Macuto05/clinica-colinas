# Sistema de Gestión de Clínica - Clean Architecture

Sistema de gestión para clínica implementado con **Clean Architecture** usando Next.js 16, TypeScript, Prisma 7 y PostgreSQL.

## 🏗️ Arquitectura

Este proyecto sigue los principios de **Clean Architecture** (Arquitectura Limpia) de Robert C. Martin, separando el código en 4 capas concéntricas:

```
1. Domain      → Reglas de negocio puras
2. Application → Casos de uso
3. Infrastructure → Implementaciones (Prisma, HTTP)
4. Presentation → UI (Next.js, React)
```

**📚 Lee la documentación completa**: [`docs/CLEAN_ARCHITECTURE.md`](./docs/CLEAN_ARCHITECTURE.md)

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd clinica-next

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL

# 4. Generar Prisma Client
npx prisma generate

# 5. Ejecutar migraciones
npx prisma migrate dev

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura del Proyecto

```
src/
├── domain/                  # Capa 1: Entidades y reglas de negocio
│   ├── entities/
│   ├── value-objects/
│   └── repositories/        # Interfaces
│
├── application/             # Capa 2: Casos de uso
│   ├── use-cases/
│   └── dto/
│
├── infrastructure/          # Capa 3: Implementaciones
│   ├── database/prisma/
│   ├── http/controllers/
│   ├── services/
│   └── di/                  # Dependency Injection
│
└── app/                     # Capa 4: Next.js (UI + API)
    ├── api/
    ├── (pages)/
    └── components/
```

## 🔑 Características Principales

### Autenticación
- ✅ Registro de usuarios (pacientes, doctores, admin)
- ✅ Login con JWT
- ✅ Roles (PATIENT, DOCTOR, ADMIN, NURSE, LAB, INVENTORY)

### Gestión de Citas
- ✅ Agendar cita
- ✅ Cancelar cita
- ✅ Ver citas por paciente/doctor
- ✅ Validación de disponibilidad

### Doctores y Especialidades
- ✅ Listar doctores por especialidad
- ✅ Consultar disponibilidad de doctor

## 🛠️ Tecnologías

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT con `jsonwebtoken`
- **Hashing**: bcryptjs
- **Estilos**: Tailwind CSS 4

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments?patientId=1` - Listar citas de paciente
- `GET /api/appointments?doctorId=1` - Listar citas de doctor
- `PUT /api/appointments/[id]/cancel` - Cancelar cita

### Doctores
- `GET /api/doctors?specialityId=1` - Listar doctores por especialidad
- `GET /api/doctors/[id]/availability?startDate=...&endDate=...` - Ver disponibilidad

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests de dominio
npm test -- domain

# Tests de aplicación
npm test -- application
```

## 🗄️ Base de Datos

### Ejecutar Migraciones

```bash
npx prisma migrate dev
```

### Prisma Studio (GUI)

```bash
npx prisma studio
```

## 👥 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **PATIENT** | Pacientes del sistema |
| **DOCTOR** | Médicos |
| **ADMIN** | Administradores |
| **NURSE** | Enfermeras |
| **LAB** | Personal de laboratorio |
| **INVENTORY** | Control de inventario |

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clinica_db"

# JWT
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"

# Next.js
NODE_ENV="development"
```

## 📖 Documentación

- **[Clean Architecture Guide](./docs/CLEAN_ARCHITECTURE.md)** - Guía completa de la arquitectura
- **[Prisma Schema](./prisma/schema.prisma)** - Modelo de base de datos
- **[API Documentation](./docs/API.md)** - Documentación de endpoints (TODO)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de una tesis de grado.

## 🙏 Agradecimientos

- Robert C. Martin - Clean Architecture
- Prisma Team
- Next.js Team
