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

La referencia interactiva de la API está disponible en `/docs` y no requiere iniciar sesión. La especificación OpenAPI se sirve desde `/openapi.json`. Consultar la documentación es público; para ejecutar `POST /api/licenses/verify` sigue siendo obligatorio enviar la API Key del servidor en el header `x-api-key`.

---

## ⚙️ Configuración y Variables de Entorno

Crea un archivo `.env` en la raíz de tu proyecto con las siguientes variables:

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"
JWT_SECRET="tu_secreto_super_seguro_para_firmar_tokens"
BACKEND_API_KEY="clave_secreta_que_conocera_tu_app_de_escritorio"
```

---

## 🚀 Despliegue Gratuito y Escalable

1. **Base de Datos:** Aloja tu base de datos PostgreSQL de forma gratuita en [Supabase](https://supabase.com/) o [Neon](https://neon.tech/).
2. **Backend/API:** Despliega este proyecto de Next.js en [Vercel](https://vercel.com/) utilizando su capa gratuita (*Hobby Tier*), ideal para APIs de licenciamiento con tráfico de baja/mediana concurrencia.