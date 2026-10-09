import { prisma } from './db';
import { generateLicenseToken } from './jwt';
import type { VerifyRequest, VerifyResponse } from '../types';

export async function verifyLicense(request: VerifyRequest): Promise<VerifyResponse> {
  const { clientNit, appCode, hardwareId } = request;

  try {
    // 1. Buscar cliente por NIT
    const client = await prisma.client.findFirst({
      where: { nit: clientNit },
    });

    if (!client) {
      return { valid: false, message: 'Cliente no encontrado' };
    }

    // 2. Buscar aplicación por código
    const application = await prisma.application.findUnique({
      where: { code: appCode },
    });

    if (!application) {
      return { valid: false, message: 'Aplicación no encontrada' };
    }

    // 3. Buscar la licencia correspondiente
    const license = await prisma.license.findFirst({
      where: {
        clientId: client.id,
        applicationId: application.id,
      },
    });

    if (!license) {
      return { valid: false, message: 'Licencia no encontrada para este cliente y aplicación' };
    }

    // 4. Validar si está activa manualmente
    if (!license.isActive) {
      return { valid: false, message: 'La licencia está inactiva (falta de pago o suspensión)' };
    }

    // 5. Validar expiración automática por fecha (solo si no es lifetime)
    const now = new Date();
    if (license.expiresAt && new Date(license.expiresAt) < now) {
      return { valid: false, message: 'La licencia ha expirado automáticamente por fecha' };
    }

    // 6. Validar hardwareId si la licencia está bloqueada a un equipo específico
    if (license.hardwareId && license.hardwareId !== hardwareId) {
      return { valid: false, message: 'La licencia no corresponde a este equipo (Hardware ID inválido)' };
    }

    // 7. Generar token JWT firmado para caché offline (7 días de gracia)
    const tokenPayload = {
      clientId: client.id,
      clientNit: client.nit,
      applicationId: application.id,
      appCode: application.code,
      hardwareId: license.hardwareId,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : null,
    };

    const licenseToken = generateLicenseToken(tokenPayload);

    return {
      valid: true,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : undefined,
      licenseToken,
    };
  } catch (error) {
    console.error('Error al verificar licencia:', error);
    return { valid: false, message: 'Error interno del servidor' };
  }
}
