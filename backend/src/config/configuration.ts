export interface ApplicationConfiguration {
  nodeEnv: 'development' | 'test' | 'production';
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

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const loadAppConfig = (): ApplicationConfiguration => {
  const rawNodeEnv = process.env.NODE_ENV ?? 'development';
  const nodeEnv: ApplicationConfiguration['nodeEnv'] =
    rawNodeEnv === 'production' || rawNodeEnv === 'test' ? rawNodeEnv : 'development';

  return {
    nodeEnv,
    app: {
      port: Number(process.env.PORT ?? 3000),
      corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS)
    },
    database: {
      url: getRequiredEnv('DATABASE_URL')
    },
    auth: {
      jwtSecret: getRequiredEnv('JWT_SECRET'),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d'
    },
    rateLimit: {
      limit: Number(process.env.RATE_LIMIT_LIMIT ?? 100),
      ttl: Number(process.env.RATE_LIMIT_TTL ?? 60)
    }
  };
};
