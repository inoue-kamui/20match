import type { EnvVariables } from './validation';

export interface ApplicationConfiguration {
  nodeEnv: EnvVariables['NODE_ENV'];
  app: {
    port: number;
    corsOrigins: string[];
  };
  database: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  rateLimit: {
    limit: number;
    ttl: number;
  };
}

const parseCorsOrigins = (rawOrigin?: string): string[] => {
  if (!rawOrigin || rawOrigin.trim().length === 0) {
    return ['*'];
  }

  return rawOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const loadAppConfig = (): ApplicationConfiguration => {
  const env = process.env as NodeJS.ProcessEnv & EnvVariables;

  return {
    nodeEnv: env.NODE_ENV,
    app: {
      port: Number(env.PORT ?? 3000),
      corsOrigins: parseCorsOrigins(env.CORS_ORIGINS)
    },
    database: {
      url: env.DATABASE_URL
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN ?? '1d'
    },
    rateLimit: {
      limit: Number(env.RATE_LIMIT_LIMIT ?? 100),
      ttl: Number(env.RATE_LIMIT_TTL ?? 60)
    }
  };
};
