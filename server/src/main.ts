import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 4000, not 3000 — Next.js also defaults to 3000, so if this ever runs
  // without PORT explicitly set (e.g. locally, outside docker-compose, which
  // does set it), it would otherwise silently fight the client for the port.
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
