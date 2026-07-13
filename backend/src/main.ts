import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`DMS WashControl API running on http://localhost:${port}/api/v1`);
}
bootstrap();
