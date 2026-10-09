import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withIdempotency } from '@/lib/idempotency/middleware';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(3, 'Nombre requerido'),
  nit: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { licenses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return NextResponse.json({ error: 'Error al listar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return withIdempotency(request, '/api/admin/clients', 'POST', async (body) => {
    const validation = clientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, nit, email } = validation.data;

    if (nit) {
      const existing = await prisma.client.findFirst({ where: { nit } });
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este NIT' },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        nit: nit || null,
        email: email || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  });
}
