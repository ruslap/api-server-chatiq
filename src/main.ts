import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // For development, true allows any origin. In production, we should specify list.
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
