import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

const app = await NestFactory.create(AppModule);
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
);
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
});
await app.listen(process.env.PORT ?? 3000);