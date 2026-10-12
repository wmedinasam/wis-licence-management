import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'openapi.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json({ message: 'No se pudo cargar el esquema OpenAPI.' }, { status: 500 });
  }
}
