import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

const JWT_EXPIRATION = '7d'; // 7 días de gracia para modo offline

export function generateLicenseToken(payload: object): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no disponible');
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    algorithm: 'HS256',
  });
}

export function verifyLicenseToken(token: string): JwtPayload | string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no disponible');
  }
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayload | string;
}
