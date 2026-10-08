import { env } from './env';

export function validateApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) {
    return false;
  }
  return apiKey === env.backendApiKey;
}
