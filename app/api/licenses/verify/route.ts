import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-key';
import { verifyLicense } from '@/lib/license-verify';
import type { VerifyRequest } from '@/types';

export async function POST(request: NextRequest) {
  // Validar API Key
  const apiKey = request.headers.get('x-api-key') ?? undefined;
  if (!validateApiKey(apiKey)) {
    return NextResponse.json(
      { valid: false, message: 'API Key inválida o faltante' },
      { status: 401 }
    );
  }

  try {
    const body: VerifyRequest = await request.json();
    const result = await verifyLicense(body);

    if (result.valid) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error('Error en el endpoint de verificación:', error);
    return NextResponse.json(
      { valid: false, message: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
