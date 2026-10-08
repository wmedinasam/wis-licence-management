import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireIdempotencyKey, withIdempotency } from '@/lib/idempotency/middleware';

const prisma = new PrismaClient();

const applicationSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/, 'Código debe ser mayúsculas, números y guiones bajos'),
  name: z.string().min(3),
});

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        licenses: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error al obtener aplicaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener aplicaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const idempotencyKey = requireIdempotencyKey(request);
  
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'Header Idempotency-Key es requerido' },
      { status: 400 }
    );
  }

  return withIdempotency(
    idempotencyKey,
    '/api/admin/applications',
    'POST',
    async () => {
      try {
        const body = await request.json();
        const validatedData = applicationSchema.parse(body);

        const application = await prisma.application.create({
          data: validatedData,
        });

        return NextResponse.json(application, { status: 201 });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Datos inválidos', details: error.errors },
            { status: 400 }
          );
        }

        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'El código de aplicación ya existe' },
            { status: 409 }
          );
        }

        console.error('Error al crear aplicación:', error);
        return NextResponse.json(
          { error: 'Error al crear aplicación' },
          { status: 500 }
        );
      }
    }
  );
}
