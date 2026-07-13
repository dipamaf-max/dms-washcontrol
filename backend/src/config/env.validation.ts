import { plainToInstance } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MinLength, validateSync } from 'class-validator';

const FORBIDDEN_SECRETS = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'dev-access-secret',
  'dev-refresh-secret',
]);

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET doit contenir au moins 16 caractères' })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET doit contenir au moins 16 caractères' })
  JWT_REFRESH_SECRET: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Configuration invalide:\n${errors.toString()}`);
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (FORBIDDEN_SECRETS.has(String(config[key]))) {
      throw new Error(
        `${key} utilise une valeur par défaut non sécurisée. Générez un secret aléatoire fort avant de démarrer.`,
      );
    }
  }

  return validatedConfig;
}
