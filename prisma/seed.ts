import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear cliente de prueba
  const client = await prisma.client.create({
    data: {
      name: 'Empresa Demo S.A.',
      nit: '1234567-8',
      email: 'demo@empresa.gt',
    },
  });

  console.log('✅ Cliente creado:', client);

  // Crear aplicación de prueba
  const app = await prisma.application.create({
    data: {
      code: 'SAE_FACTURACION_GT',
      name: 'Sistema de Facturación Aspel SAE Guatemala',
    },
  });

  console.log('✅ Aplicación creada:', app);

  // Crear licencia válida por 1 año
  const license = await prisma.license.create({
    data: {
      clientId: client.id,
      applicationId: app.id,
      expiresAt: new Date('2027-10-08T23:59:59.000Z'),
      isActive: true,
    },
  });

  console.log('✅ Licencia creada:', license);

  // Crear una segunda aplicación para probar multi-app
  const app2 = await prisma.application.create({
    data: {
      code: 'CONTROL_INVENTARIO',
      name: 'Control de Inventario',
    },
  });

  console.log('✅ Segunda aplicación creada:', app2);

  // Crear licencia para la segunda app
  const license2 = await prisma.license.create({
    data: {
      clientId: client.id,
      applicationId: app2.id,
      expiresAt: new Date('2027-06-30T23:59:59.000Z'),
      isActive: true,
      hardwareId: 'PC-001-DEMO',
    },
  });

  console.log('✅ Segunda licencia creada (con hardwareId):', license2);

  console.log('\n🎉 Datos de prueba creados exitosamente');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
