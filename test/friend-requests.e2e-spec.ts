import { Test, TestingModule } from '@nestjs/testing';
import { clearDatabase } from './utils';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('FriendRequestsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });
});
