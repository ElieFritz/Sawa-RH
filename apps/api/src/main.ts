import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

function parseCorsOrigins(rawValue?: string) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const prismaService = app.get(PrismaService);
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  await prismaService.enableShutdownHooks(app);

  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.enableCors({
    origin:
      corsOrigins.length === 0
        ? true
        : (origin, callback) => {
            if (!origin || corsOrigins.includes(origin)) {
              callback(null, true);
              return;
            }

            callback(new Error('Not allowed by CORS'));
          },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SAWA RH API')
    .setDescription('REST API for SAWA RH')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  Logger.log(`API ready on port ${port}`, 'Bootstrap');
}

void bootstrap();
