import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { generateLicenseToken } from './jwt';
import type { VerifyRequest, VerifyResponse } from '../types';

const prisma = new PrismaClient();

export async function verifyLicense(request: VerifyRequest): Promise<VerifyResponse> {
  // Validar parámetros obligatorios
  if (!request.clientNit || !request.appCode) {
    return {
      valid: false,
      message: 'Faltan parámetros obligatorios: clientNit y appCode son requeridos',
    };
  }

  try {
    // Buscar cliente por NIT
    const client = await prisma.client.findUnique({
      where: { nit: request.clientNit },
    });

    if (!client) {
      return {
        valid: false,
        message: 'Cliente no encontrado',
      };
    }

    // Buscar aplicación por código
    const application = await prisma.application.findUnique({
      where: { code: request.appCode },
    });

    if (!application) {
      return {
        valid: false,
        message: 'Aplicación no encontrada',
      };
    }

    // Buscar licencia activa
    const license = await prisma.license.findFirst({
      where: {
        clientId: client.id,
        applicationId: application.id,
        isActive: true,
        expiresAt: {
          gt: new Date(), // La licencia no debe estar expirada
        },
        OR: [
          { hardwareId: null }, // Sin lock de hardware
          { hardwareId: request.hardwareId }, // Con lock de hardware que coincida
        ],
      },
    });

    if (!license) {
      return {
        valid: false,
        message: 'Licencia no encontrada o expirada',
      };
    }

    // Generar token JWT para caché offline
    const licenseToken = generateLicenseToken({
      clientId: client.id,
      clientNit: client.nit,
      applicationId: application.id,
      appCode: application.code,
      hardwareId: license.hardwareId,
      expiresAt: license.expiresAt.toISOString(),
    });

    return {
      valid: true,
      expiresAt: license.expiresAt.toISOString(),
      licenseToken,
    };
  } catch (error) {
    console.error('Error al verificar licencia:', error);
    return {
      valid: false,
      message: 'Error interno del servidor',
    };
  } finally {
    await prisma.$disconnect();
  }
}
