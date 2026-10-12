# Sistema de Licenciamiento Centralizado (Multi-App)

Este repositorio contiene la arquitectura y el backend centralizado para la gestión y validación de licencias de software, desarrollado en **Next.js (App Router)** con **Prisma** y **PostgreSQL**. 

Está diseñado específicamente para soportar aplicaciones de escritorio (como software de facturación en .NET WPF integrado con Aspel SAE en Guatemala) y futuras aplicaciones adicionales, permitiendo validaciones *online* y un modo *offline* seguro mediante tokens firmados (JWT).

---

## 🚀 Arquitectura del Proyecto

```text
[ App WPF / .NET Desktop ] --(HTTPS / API Key)---> [ Next.js API (Vercel) ] ---> [ PostgreSQL (Supabase/Neon) ]
       │                                                      │
       └─(Guarda Token Cifrado Local / Modo Offline)──────────┘
```

1. **API Central (Next.js):** Valida las peticiones de los clientes y emite tokens de licencia firmados digitalmente.
2. **Panel de Administración:** Permite administrar clientes, asociarles aplicaciones y definir fechas de expiración.
3. **Caché Local / Offline:** Las aplicaciones de escritorio almacenan un JWT cifrado con un período de gracia (ej. 7 días) para permitir operar ante caídas de internet.

---

## 🛠️ Stack Tecnológico

* **Framework:** Next.js (App Router, TypeScript)
* **ORM:** Prisma
* **Base de Datos:** PostgreSQL (Compatible con Supabase, Neon, etc.)
* **Seguridad:** JSON Web Tokens (`jsonwebtoken`) y API Keys para autenticación de servicios.

---

## 📂 Estructura de Base de Datos (Prisma Schema)

El modelo de datos está diseñado para ser **multi-aplicación**, desacoplando los clientes de los productos de software.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Client {
  id        String    @id @default(uuid())
  name      String    // Nombre o razón social de la empresa
  nit       String?   // NIT (Identificación fiscal, ej. Guatemala)
  email     String?
  createdAt DateTime  @default(now())
  licenses  License[]
}

model Application {
  id       String    @id @default(uuid())
  code     String    @unique // Ej: "SAE_FACTURACION_GT", "CONTROL_INVENTARIO"
  name     String    // Nombre legible de la app
  licenses License[]
}

model License {
  id            String      @id @default(uuid())
  clientId      String
  client        Client      @relation(fields: [clientId], references: [id])
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  expiresAt     DateTime    // Fecha de expiración de la licencia
  isActive      Boolean     @default(true)
  hardwareId    String?     // Opcional: Bloquear licencia a un PC/Servidor específico
  updatedAt     DateTime    @updatedAt
}
```

---

## 🔌 Endpoint de Validación (API Route)

**Ruta:** `POST /api/licenses/verify`

### Headers requeridos:
* `x-api-key`: `TU_API_KEY_SECRETA_INTERNA` (Clave estática para autorizar a la app de escritorio).
* `Content-Type`: `application/json`

### Body de la petición (JSON):
```json
{
  "clientNit": "1234567-8",
  "appCode": "SAE_FACTURACION_GT",
  "hardwareId": "opcional-id-maquina"
}
```

### Respuesta exitosa (`200 OK`):
```json
{
  "valid": true,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "licenseToken": "eyJhbGciOiJIUzI1NiIsIn..." // Token JWT firmado para guardar en caché local
}
```

---

## 📖 Documentación interactiva

La referencia interactiva de la API está disponible en `/docs` y no requiere iniciar sesión. La especificación OpenAPI se sirve desde `/openapi.json`. La página incluye un botón que solicita `POST /api/licenses/demo-token` para generar un valor ficticio de demostración, sin API Key ni acceso a licencias reales. Este valor no es un JWT válido y no funciona para producción. Para ejecutar `POST /api/licenses/verify` contra licencias reales sigue siendo obligatorio enviar la API Key del servidor en el header `x-api-key`.

---

## ⚙️ Configuración y Variables de Entorno

Para desarrollo local, conserva PostgreSQL local y configura `.env` (para Prisma CLI) y/o `.env.local` (para Next.js), ambos ignorados por Git:

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/wis_licences?schema=public"
JWT_SECRET="tu_secreto_super_seguro_para_firmar_tokens"
BACKEND_API_KEY="clave_secreta_que_conocera_tu_app_de_escritorio"
```

Configura `DIRECT_URL` con la misma conexión local que `DATABASE_URL`; puedes usar como referencia `.env.example`. No guardes contraseñas reales ni URLs privadas en archivos versionados.

---

## 🚀 Despliegue Gratuito y Escalable

1. **Base de datos:** En Supabase, usa la URL del pooler transaccional (puerto `6543`) para las conexiones de la aplicación y la URL del pooler de sesión (puerto `5432`) para las migraciones:

   ```env
   DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<POOLER_HOST>:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<POOLER_HOST>:5432/postgres"
   ```

   Sustituye los marcadores por los datos de conexión de Supabase y codifica los caracteres especiales de la contraseña para URL. Prisma usa `DATABASE_URL` en ejecución y `DIRECT_URL` para operaciones de migración. Para desarrollo local, conserva ambas variables apuntando a PostgreSQL local; no reemplaces esas conexiones por las de producción.
2. **Crear el schema en Supabase:** La base debe estar vacía. Desde un entorno seguro que tenga configuradas las dos variables de Supabase, ejecuta `npx prisma migrate deploy`. Esto aplica las migraciones versionadas existentes; no uses `prisma init` ni `prisma migrate dev` contra producción. No se copian automáticamente los datos de PostgreSQL local.
3. **Vercel:** En la configuración del proyecto, agrega `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` y `BACKEND_API_KEY` como variables de entorno de producción (y de otros entornos solo si corresponde). Despliega la app con el flujo nativo de Next.js en Vercel.
4. **Verificación:** Tras aplicar las migraciones, ejecuta `npx prisma migrate status` con las conexiones de Supabase y confirma que las migraciones están aplicadas antes de dirigir la aplicación de producción a esa base de datos.

Configura las credenciales privadas únicamente en archivos locales ignorados por Git o en las variables de entorno de Vercel.