import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireIdempotencyKey, withIdempotency } from '@/lib/idempotency/middleware';

const prisma = new PrismaClient();

const clientSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  nit: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
});

// GET - Listar todos los clientes
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        licenses: {
          include: {
            application: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
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
    '/api/admin/clients',
    'POST',
    async () => {
      try {
        const body = await request.json();
        const validatedData = clientSchema.parse(body);

        const client = await prisma.client.create({
          data: validatedData,
        });

        return NextResponse.json(client, { status: 201 });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Datos inválidos', details: error.errors },
            { status: 400 }
          );
        }

        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'El NIT ya existe' },
            { status: 409 }
          );
        }

        console.error('Error al crear cliente:', error);
        return NextResponse.json(
          { error: 'Error al crear cliente' },
          { status: 500 }
        );
      }
    }
  );
}
