import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth/admin-auth';

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
