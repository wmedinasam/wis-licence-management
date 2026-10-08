# Guía para Agentes - Sistema de Licenciamiento

## Estado del Proyecto

**Fase:** Setup inicial completado. Estructura base de Next.js + Prisma configurada.

## Arquitectura Objetivo

Sistema de licenciamiento multi-aplicación para apps de escritorio (principalmente .NET WPF con integración Aspel SAE en Guatemala).

**Stack implementado:**
- Next.js 16.4 (App Router) + TypeScript
- Prisma ORM (v5.22) + PostgreSQL
- JWT para tokens de licencia
- API Keys para autenticación de servicios

**Despliegue planeado:**
- Backend: Vercel (tier gratuito)
- Base de datos: Supabase o Neon (tier gratuito)

## Modelo de Datos Clave

Tres entidades principales en `prisma/schema.prisma`:
- `Client`: Clientes con NIT (Guatemala), email
- `Application`: Apps identificadas por código único (ej: `SAE_FACTURACION_GT`)
- `License`: Relación cliente-app con `expiresAt`, `isActive`, `hardwareId` opcional

## Endpoint Principal

`POST /api/licenses/verify` (ubicado en `app/api/licenses/verify/route.ts`)

**Headers requeridos:**
- `x-api-key`: Validado contra `BACKEND_API_KEY`

**Body esperado:**
```json
{
  "clientNit": "1234567-8",
  "appCode": "SAE_FACTURACION_GT",
  "hardwareId": "opcional-id-maquina"
}
```

**Respuesta exitosa (200):**
```json
{
  "valid": true,
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "licenseToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

El `licenseToken` es un JWT firmado con período de gracia de 7 días para caché offline.

## Variables de Entorno Requeridas

En `.env.local` o `.env` (NO en git):

```env
DATABASE_URL              # PostgreSQL connection string
JWT_SECRET                # Min 32 caracteres, para firmar tokens
BACKEND_API_KEY           # Clave que conocerán las apps de escritorio
NODE_ENV                  # "development" o "production"
```

Ver `.env.example` para template.

## Estructura de Carpetas

```
app/
  api/
    licenses/
      verify/
        route.ts          # Endpoint POST /api/licenses/verify
lib/
  api-key.ts              # Validación de API Key
  env.ts                  # Carga de variables de entorno
  jwt.ts                  # Generación y verificación de JWT
  license-verify.ts       # Lógica de verificación de licencias
prisma/
  schema.prisma           # Definición del modelo de datos
types/
  index.ts                # Interfaces de TypeScript
```

## Comandos Esenciales

```bash
# Desarrollo
npm run dev              # Inicia dev server en http://localhost:3000

# Construcción
npm run build            # Build para producción
npm start                # Inicia servidor de producción

# Base de datos
npx prisma generate     # Regenera Prisma Client
npx prisma migrate dev --name nombre_migracion  # Crea y aplica migración
npx prisma studio      # Abre UI para gestionar datos (requiere DB conectada)

# Linting
npm run lint            # Ejecuta ESLint
```

## Consideraciones Importantes

1. **Modo offline:** Las apps desktop deben operar sin conexión usando JWT cacheado (~7 días)
2. **Multi-app:** Sistema soporta múltiples aplicaciones por cliente
3. **Hardware lock opcional:** `hardwareId` vincula licencia a máquina específica
4. **Mercado objetivo:** Guatemala → campo `nit` es relevante
5. **Base de datos:** Aún no conectada. Requiere configurar `DATABASE_URL` a PostgreSQL real

## Próximos Pasos de Implementación

1. ✅ Configurar proyecto Next.js con TypeScript
2. ✅ Implementar Prisma schema según el README
3. ✅ Crear endpoint `/api/licenses/verify` con validación de API key
4. ✅ Implementar generación y firma de JWT
5. ✅ Conectar a base de datos PostgreSQL (Local con Docker)
6. ✅ Crear migrations de Prisma (`20261008211447_init`)
7. ✅ Poblar datos de prueba (seed script en `prisma/seed.ts`)
8. ✅ Verificar funcionamiento del endpoint (probado exitosamente)
9. **TODO:** Implementar panel de administración (CRUD de clientes/apps/licencias)
10. **TODO:** Tests unitarios para verificación de licencias
11. **TODO:** Documentación de API (OpenAPI/Swagger)
12. **TODO:** Configurar conexión a Supabase para producción
13. **TODO:** Deployment a Vercel

## Testing Local del Endpoint

Cuando la DB esté conectada:

```bash
curl -X POST http://localhost:3000/api/licenses/verify \
  -H "x-api-key: mi_clave_secreta_que_conocera_tu_app_de_escritorio_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "clientNit": "1234567-8",
    "appCode": "SAE_FACTURACION_GT"
  }'
```

