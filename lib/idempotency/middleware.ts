import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function withIdempotency(
  idempotencyKey: string,
  endpoint: string,
  method: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // 1. Buscar request previo
    const cached = await prisma.idempotencyRequest.findUnique({
      where: { id: idempotencyKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      // Retornar respuesta cacheada
      return new NextResponse(JSON.stringify(cached.responseBody), {
        status: cached.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Replay': 'true',
        },
      });
    }

    // 2. Ejecutar handler
    const response = await handler();
    const body = await response.json();

    // 3. Guardar resultado (solo para requests exitosos)
    if (response.status >= 200 && response.status < 300) {
      await prisma.idempotencyRequest.create({
        data: {
          id: idempotencyKey,
          endpoint,
          method,
          statusCode: response.status,
          responseBody: body,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });
    }

    return new NextResponse(JSON.stringify(body), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error en idempotencia:', error);
    throw error;
  }
}

export function requireIdempotencyKey(request: Request): string | null {
  const key = request.headers.get('Idempotency-Key');
  if (!key) {
    return null;
  }
  return key;
}
