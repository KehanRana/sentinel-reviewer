import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for webhook signature verification
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Sentinel-Reviewer is running on port ${port}`);
  logger.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/github`);
}
bootstrap();
