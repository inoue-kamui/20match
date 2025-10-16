import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60)
});

export type EnvVariables = z.infer<typeof envSchema>;

export const validateEnv = (environment: Record<string, unknown>): EnvVariables => {
  const parsed = envSchema.safeParse(environment);

  if (!parsed.success) {
    const details = parsed.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
};
