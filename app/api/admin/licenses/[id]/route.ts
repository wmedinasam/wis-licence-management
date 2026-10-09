import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const licenseUpdateSchema = z.object({
  expiresAt: z.string().datetime().refine((date) => new Date(date) > new Date(), {
    message: 'La fecha de expiración debe ser en el futuro',
  }).optional(),
  isActive: z.boolean().optional(),
  hardwareId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        client: true,
        application: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'Licencia no encontrada' },
        { status: 404 }
      );
    }

    const daysUntilExpiration = Math.ceil(
      (license.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      ...license,
      daysUntilExpiration,
      isExpired: license.expiresAt < new Date(),
      isExpiringSoon: 
        license.isActive && 
        license.expiresAt > new Date() && 
        daysUntilExpiration <= 30,
    });
  } catch (error) {
    console.error('Error al obtener licencia:', error);
    return NextResponse.json(
      { error: 'Error al obtener licencia' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = licenseUpdateSchema.parse(body);

    const license = await prisma.license.update({
      where: { id },
      data: validatedData,
      include: {
        client: true,
        application: true,
      },
    });

    const daysUntilExpiration = Math.ceil(
      (license.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      ...license,
      daysUntilExpiration,
      isExpired: license.expiresAt < new Date(),
      isExpiringSoon: 
        license.isActive && 
        license.expiresAt > new Date() && 
        daysUntilExpiration <= 30,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Licencia no encontrada' },
        { status: 404 }
      );
    }

    console.error('Error al actualizar licencia:', error);
    return NextResponse.json(
      { error: 'Error al actualizar licencia' },
      { status: 500 }
    );
  }
}
