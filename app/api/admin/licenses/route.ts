import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireIdempotencyKey, withIdempotency } from '@/lib/idempotency/middleware';

const prisma = new PrismaClient();

const licenseSchema = z.object({
  clientId: z.string().uuid('ID de cliente inválido'),
  applicationId: z.string().uuid('ID de aplicación inválido'),
  expiresAt: z.string().datetime().refine((date) => new Date(date) > new Date(), {
    message: 'La fecha de expiración debe ser en el futuro',
  }),
  isActive: z.boolean().default(true),
  hardwareId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');

    const where: any = {};

    if (clientId) where.clientId = clientId;
    if (applicationId) where.applicationId = applicationId;

    if (status === 'active') {
      where.isActive = true;
      where.expiresAt = { gt: new Date() };
    } else if (status === 'expired') {
      where.expiresAt = { lt: new Date() };
    } else if (status === 'expiring_soon') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.isActive = true;
      where.expiresAt = { gt: new Date(), lt: thirtyDaysFromNow };
    }

    const licenses = await prisma.license.findMany({
      where,
      include: {
        client: true,
        application: true,
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    const licensesWithCalculations = licenses.map((license) => ({
      ...license,
      daysUntilExpiration: Math.ceil(
        (license.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      isExpired: license.expiresAt < new Date(),
      isExpiringsoon: 
        license.isActive && 
        license.expiresAt > new Date() && 
        Math.ceil((license.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30,
    }));

    return NextResponse.json(licensesWithCalculations);
  } catch (error) {
    console.error('Error al obtener licencias:', error);
    return NextResponse.json(
      { error: 'Error al obtener licencias' },
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
    '/api/admin/licenses',
    'POST',
    async () => {
      try {
        const body = await request.json();
        const validatedData = licenseSchema.parse(body);

        const license = await prisma.$transaction(async (tx) => {
          // Verificar que no exista licencia duplicada
          const existing = await tx.license.findFirst({
            where: {
              clientId: validatedData.clientId,
              applicationId: validatedData.applicationId,
              hardwareId: validatedData.hardwareId,
            },
          });

          if (existing) {
            throw new Error('Esta licencia ya existe');
          }

          return await tx.license.create({
            data: validatedData,
            include: {
              client: true,
              application: true,
            },
          });
        });

        return NextResponse.json(license, { status: 201 });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return NextResponse.json(
            { error: 'Datos inválidos', details: error.errors },
            { status: 400 }
          );
        }

        if (error.message === 'Esta licencia ya existe') {
          return NextResponse.json(
            { error: 'Esta licencia ya existe' },
            { status: 409 }
          );
        }

        console.error('Error al crear licencia:', error);
        return NextResponse.json(
          { error: 'Error al crear licencia' },
          { status: 500 }
        );
      }
    }
  );
}
