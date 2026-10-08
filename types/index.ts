// Tipos para la API de Licencias

export interface VerifyRequest {
  clientNit: string;
  appCode: string;
  hardwareId?: string;
}

export interface VerifyResponse {
  valid: boolean;
  expiresAt?: string;
  licenseToken?: string;
  message?: string;
}

export interface LicensePayload {
  clientId: string;
  clientNit: string;
  applicationId: string;
  appCode: string;
  hardwareId?: string;
  iat: number;
  exp: number;
}
