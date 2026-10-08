import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const applicationUpdateSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/).optional(),
  name: z.string().min(3).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        licenses: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Aplicación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener aplicación' },
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
    const validatedData = applicationUpdateSchema.parse(body);

    const application = await prisma.application.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(application);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El código ya existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar aplicación' },
      { status: 500 }
    );
  }
}
