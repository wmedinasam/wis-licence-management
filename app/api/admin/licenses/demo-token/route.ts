import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export async function POST() {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json({
    valid: true,
    demo: true,
    expiresAt,
    licenseToken: `DEMO_ONLY.${randomUUID()}`,
    message: 'Token ficticio para probar la documentación; no es un JWT ni sirve para validar licencias reales.',
  });
}
