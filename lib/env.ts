import { config } from 'dotenv';

config({ path: '.env' });

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  backendApiKey: process.env.BACKEND_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};
