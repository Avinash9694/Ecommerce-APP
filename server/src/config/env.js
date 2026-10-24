import 'dotenv/config';

const env = process.env;
const nodeEnv = env.NODE_ENV ?? 'development';
const isTest = nodeEnv === 'test' || Boolean(env.VITEST);

if (nodeEnv === 'production' && !env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  nodeEnv,
  isTest,
  isProduction: nodeEnv === 'production',
  port: Number(env.PORT ?? 8080),
  mongoUri: env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/ecommerce',
  jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtExpiresIn: env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
