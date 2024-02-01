import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { STORES_ENDPOINT } from '../src/stores/stores.controller';
import { StoresService } from '../src/stores/stores.service';
import { AppModule } from './../src/app.module';
import { clearDatabase, isErrorResponse, login } from './utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let storesService: StoresService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    storesService = app.get(StoresService);
    const loginData = await login(app);
    authHeader = loginData.authHeader;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(STORES_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and array with length of 0 with authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        await storesService.create(
          faker.company.name(),
          faker.location.streetAddress(),
          faker.internet.url(),
        );
      }

      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} and a store with authorization`, async () => {
      const store = await storesService.create(
        faker.company.name(),
        faker.location.streetAddress(),
        faker.internet.url(),
      );

      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toEqual(store.id);
            expect(item.address).toEqual(store.address);
            expect(item.url).toEqual(store.url);
            expect(item.updatedAt).toEqual(store.updatedAt.toISOString());
            expect(item.createdAt).toEqual(store.createdAt.toISOString());
          });
        });
    });

    it(`should return ${HttpStatus.OK} and a store with no wines with authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.wines).toBeUndefined();
        });
    });
  });
});
