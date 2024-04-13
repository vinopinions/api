import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import admin from 'firebase-admin';
import packagejson from '../package.json';
import { AppModule } from './app.module';
import { DummyDataService } from './dummy-data/dummy-data.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: packagejson.version.split('.')[0],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vinopinions API')
    .setDescription('Documentation of the Vinopinions API')
    .setVersion(packagejson.version)
    .addBearerAuth({
      type: 'http',
      bearerFormat: 'JWT',
      scheme: 'bearer',
      description: 'Session token. Can be retrieved by logging in.',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const configService: ConfigService = app.get(ConfigService);

  const firebaseServiceAccountFilePath: string | null | undefined =
    configService.get('FIREBASE_SERVICE_ACCOUNT_FILE');
  if (firebaseServiceAccountFilePath) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseServiceAccountFilePath),
    });
  } else {
    admin.initializeApp();
  }

  const generateDummyData = configService.get<boolean>('DUMMY_DATA_GENERATION');

  if (generateDummyData) {
    const dummyDataService = app.get(DummyDataService);
    console.log('Starting dummy data generation');
    try {
      await dummyDataService.generateAndInsertDummyData(app, admin.app());
    } catch (error) {
      console.log(error);
    }
    console.log('Dummy data generation complete.');
  }

  await app.listen(3000);
}
bootstrap();
