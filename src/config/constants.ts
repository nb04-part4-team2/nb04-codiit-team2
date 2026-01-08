import { z } from 'zod';
import dotenv from 'dotenv';
import ms, { type StringValue } from 'ms';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string(),

  // Token
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'), // jwt.sign()에서 직접 사용
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'), // jwt.sign()에서 직접 사용

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().default(10),

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

// ms() 변환 + 검증
const accessTokenExpiresMs = ms(parsedEnv.data.ACCESS_TOKEN_EXPIRES_IN as StringValue);
const refreshTokenExpiresMs = ms(parsedEnv.data.REFRESH_TOKEN_EXPIRES_IN as StringValue);

if (typeof accessTokenExpiresMs !== 'number' || accessTokenExpiresMs <= 0) {
  console.error(`❌ Invalid ACCESS_TOKEN_EXPIRES_IN: ${parsedEnv.data.ACCESS_TOKEN_EXPIRES_IN}`);
  process.exit(1);
}

if (typeof refreshTokenExpiresMs !== 'number' || refreshTokenExpiresMs <= 0) {
  console.error(`❌ Invalid REFRESH_TOKEN_EXPIRES_IN: ${parsedEnv.data.REFRESH_TOKEN_EXPIRES_IN}`);
  process.exit(1);
}

// env 하나로 통합 (문자열 원본 + ms 변환값)
export const env = {
  ...parsedEnv.data,
  ACCESS_TOKEN_EXPIRES_MS: accessTokenExpiresMs,
  REFRESH_TOKEN_EXPIRES_MS: refreshTokenExpiresMs,
} as const;
