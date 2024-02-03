import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packagejson from '../package.json';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log(process.env);
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: packagejson.version.split('.')[0],
  });
  const config = new DocumentBuilder()
    .setTitle('Vinopinions API')
    .setDescription('Documentation of the Vinopinions API')
    .setVersion(packagejson.version)
    .addBearerAuth({
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      bearerFormat: 'JWT',
      scheme: 'bearer',
      description: 'Session ID. Can be retrieved by logging in.',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(3000);
}
bootstrap();
