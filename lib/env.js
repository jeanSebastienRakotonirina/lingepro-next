import dotenv from 'dotenv';
import path from 'path';

// Charge .env puis .env.local (priorité locale)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lingepro',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-lingepro-secret-key-32chars',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Text'eau",
  PORT: process.env.PORT || '3000',
};
