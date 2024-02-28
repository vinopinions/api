import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import packagejson from '../package.json';
import { AppModule } from './app.module';
import { DummyDataService } from './dummy-data/dummy-data.service';

async function bootstrap() {
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

  const generateDummyData = app
    .get(ConfigService)
    .get<boolean>('DUMMY_DATA_GENERATION');

  if (generateDummyData) {
    const dummyDataService = app.get(DummyDataService);
    console.log('Starting dummy data generation');
    await dummyDataService.generateAndInsertDummyData(app);
    console.log('Dummy data generation complete.');
  }

  await app.listen(3000);
}
bootstrap();
