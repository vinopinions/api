import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { clearDatabase, login } from './utils';
import { WINES_ENDPOINT } from '../src/wines/wines.controller';
import request from 'supertest';
import { CreateWineDto } from '../src/wines/dtos/create-wine.dto';

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

  describe('POST ' + WINES_ENDPOINT, () => {
    it(`should return ${HttpStatus.CREATED}`, () => {
      const createWineDto: CreateWineDto = {
        name: 'Wine',
        grapeVariety: 'Grapes',
        heritage: 'Germany',
        year: 2021,
        winemakerId: '1',
        storeIds: ['1'],
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(createWineDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when required field is missing`, () => {
      // name is missing
      const wineObject = {
        year: 2020,
        grapeVariety: 'Grapes',
        haritage: 'Germany',
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .send(wineObject)
        .expect((response) => response.status === HttpStatus.BAD_REQUEST);
    });
  });
});
