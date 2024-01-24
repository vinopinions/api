import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { clearDatabase, login } from './utils';
import { WINES_ENDPOINT } from '../src/wines/wines.controller';
import request from 'supertest';

describe('WinesController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginData = await login(app);
    authHeader = loginData.authHeader;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => clearDatabase(app));

  describe('GET ' + WINES_ENDPOINT, () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK}`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });
  });
});
