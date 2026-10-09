import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withIdempotency } from '@/lib/idempotency/middleware';
import { z } from 'zod';

const licenseSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  applicationId: z.string().uuid('Aplicación inválida'),
  expiresAt: z.string().datetime().optional().nullable(),
  hardwareId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const applicationId = searchParams.get('applicationId');

    const licenses = await prisma.license.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(applicationId ? { applicationId } : {}),
      },
      include: {
        client: true,
        application: true,
      },
      orderBy: { expiresAt: 'asc' },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error('Error al listar licencias:', error);
    return NextResponse.json({ error: 'Error al listar licencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return withIdempotency(request, '/api/admin/licenses', 'POST', async (body) => {
    const validation = licenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { clientId, applicationId, expiresAt, hardwareId, isActive } = validation.data;

    // Verificar existencia
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });

    const license = await prisma.license.create({
      data: {
        clientId,
        applicationId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        hardwareId: hardwareId || null,
        isActive,
      },
      include: { client: true, application: true },
    });

    return NextResponse.json(license, { status: 201 });
  });
}
