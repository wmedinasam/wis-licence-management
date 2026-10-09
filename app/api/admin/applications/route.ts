import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withIdempotency } from '@/lib/idempotency/middleware';
import { z } from 'zod';

const appSchema = z.object({
  code: z.string().min(2, 'Código requerido').toUpperCase(),
  name: z.string().min(2, 'Nombre requerido'),
});

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        _count: {
          select: { licenses: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error al listar aplicaciones:', error);
    return NextResponse.json({ error: 'Error al listar aplicaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return withIdempotency(request, '/api/admin/applications', 'POST', async (body) => {
    const validation = appSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code, name } = validation.data;

    const existing = await prisma.application.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una aplicación con este código' },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: { code, name },
    });

    return NextResponse.json(application, { status: 201 });
  });
}
