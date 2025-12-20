# Guía de Configuración de Base de Datos PostgreSQL

## ✅ Estado: PostgreSQL instalado y corriendo

PostgreSQL está instalado en tu sistema y el servicio está activo.

## 📋 Pasos para Configurar

### Paso 1: Crear la Base de Datos

Abre una terminal de PowerShell **como Administrador** y ejecuta:

```powershell
# Conectar a PostgreSQL (se te pedirá la contraseña de postgres)
psql -U postgres

# Una vez dentro de psql, ejecuta estos comandos:
CREATE DATABASE clinica_db;

# Crear un usuario para la aplicación (opcional pero recomendado)
CREATE USER clinica_user WITH ENCRYPTED PASSWORD 'tu_contraseña_segura';

# Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE clinica_db TO clinica_user;

# Salir de psql
\q
```

### Paso 2: Configurar el archivo .env

Crea o edita el archivo `.env` en la raíz del proyecto con:

```env
# Database
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/clinica_db"

# O si creaste un usuario específico:
# DATABASE_URL="postgresql://clinica_user:tu_contraseña_segura@localhost:5432/clinica_db"

# JWT Secret
JWT_SECRET="cambia-esto-por-un-secreto-muy-largo-y-aleatorio"

# Environment
NODE_ENV="development"
```

**⚠️ IMPORTANTE:** Reemplaza `TU_CONTRASEÑA` con la contraseña real de tu usuario PostgreSQL.

### Paso 3: Ejecutar Migraciones de Prisma

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las migraciones y aplicarlas
npx prisma migrate dev --name init

# Verificar que todo funcionó
npx prisma studio
```

Esto abrirá una interfaz web donde podrás ver tus tablas.

### Paso 4: (Opcional) Insertar Datos de Prueba

Si quieres datos iniciales para probar:

```bash
# Crear un archivo seed
npx prisma db seed
```

O manualmente con Prisma Studio o SQL.

## 🔧 Solución de Problemas

### No puedo conectar a PostgreSQL
```bash
# Verificar que el servicio está corriendo
Get-Service postgresql*

# Iniciar el servicio si está detenido
Start-Service postgresql-x64-XX  # Reemplaza XX con tu versión
```

### No sé mi contraseña de postgres

Si instalaste PostgreSQL recientemente, la contraseña podría ser:
- La que configuraste durante la instalación
- `postgres` (contraseña por defecto en algunas instalaciones)
- Vacía (en algunas configuraciones de desarrollo)

Para resetear la contraseña, puedes:
1. Buscar "pgAdmin" en Windows
2. Abrir pgAdmin y usar la opción de resetear contraseña

### Error de permisos

Si tienes errores de permisos, ejecuta PowerShell como Administrador.

## 📝 Siguiente Paso

Una vez completados estos pasos, ejecuta:

```bash
npm run build
```

Si el build es exitoso, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
```

Y tu API estará disponible en:
- http://localhost:3000/api/auth/register
- http://localhost:3000/api/auth/login
- http://localhost:3000/api/appointments
- etc.
