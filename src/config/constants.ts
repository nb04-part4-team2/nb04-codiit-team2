import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string(),

  // Token
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().default('10'),

  // AWS
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`❌ Missing environment variables: ${missing}`);
  process.exit(1);
}

export const env = parsedEnv.data;
