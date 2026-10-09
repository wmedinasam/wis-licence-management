import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function withIdempotency(
  request: Request,
  endpoint: string,
  method: string,
  handler: (body: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const idempotencyKey = request.headers.get('Idempotency-Key');

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'Idempotency-Key header requerido' },
      { status: 400 }
    );
  }

  try {
    // 1. Buscar request previo en la tabla de idempotencia
    const cached = await prisma.idempotencyRequest.findUnique({
      where: { id: idempotencyKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      // Retornar respuesta cacheada directamente
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode,
        headers: { 'X-Idempotency-Replay': 'true' },
      });
    }

    // 2. Leer el body de la petición una sola vez
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body vacío o no JSON
    }

    // 3. Ejecutar la lógica de negocio principal
    const response = await handler(body);

    // 4. Intentar cachear de forma asíncrona (sin bloquear ni fallar si ocurre un error de serialización)
    try {
      const responseClone = response.clone();
      const responseBody = await responseClone.json();

      await prisma.idempotencyRequest.upsert({
        where: { id: idempotencyKey },
        update: {
          statusCode: response.status,
          responseBody: responseBody,
        },
        create: {
          id: idempotencyKey,
          endpoint,
          method,
          statusCode: response.status,
          responseBody: responseBody,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        },
      });
    } catch (cacheError) {
      console.warn('Advertencia: No se pudo guardar la idempotencia en BD, pero la petición fue exitosa:', cacheError);
    }

    return response;
  } catch (error: any) {
    console.error('Error crítico en middleware de idempotencia:', error);
    return NextResponse.json(
      { error: 'Error interno en procesamiento de la solicitud', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
