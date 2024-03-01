import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ID_URL_PARAMETER } from '../src/constants/url-parameter';
import { CreateStoreDto } from '../src/stores/dtos/create-store.dto';
import {
  STORES_ENDPOINT,
  STORES_ID_ENDPOINT,
} from '../src/stores/stores.controller';
import { StoresService } from '../src/stores/stores.service';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import { clearDatabase, isErrorResponse, login } from './utils/utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let storesService: StoresService;
  let winesService: WinesService;
  let winemakersService: WinemakersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    storesService = app.get(StoresService);
    winesService = app.get(WinesService);
    winemakersService = app.get(WinemakersService);
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
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
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

  describe(STORES_ID_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(STORES_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()))
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(STORES_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          STORES_ID_ENDPOINT.replace(
            ID_URL_PARAMETER,
            faker.string.alphanumeric(10),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} and a valid store if id parameter is valid with authorization`, async () => {
      const winemaker = await winemakersService.create(faker.person.fullName());
      const store = await storesService.create(
        faker.company.name(),
        faker.location.streetAddress(),
        faker.internet.url(),
      );
      const wines = [];
      for (let i = 0; i < 3; i++) {
        wines.push(
          await winesService.create(
            faker.person.fullName(),
            faker.date.past().getFullYear(),
            winemaker.id,
            [store.id],
            faker.word.noun(),
            faker.location.country(),
          ),
        );
      }
      store.wines = wines;

      return request(app.getHttpServer())
        .get(STORES_ID_ENDPOINT.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(store.id);
          expect(body.name).toEqual(store.name);
          expect(body.address).toEqual(store.address);
          expect(body.url).toEqual(store.url);
          expect(body.createdAt).toEqual(store.createdAt.toISOString());
          expect(body.updatedAt).toEqual(store.updatedAt.toISOString());
          (body.wines as Array<any>).forEach((wine, index) => {
            expect(wine.id).toEqual(store.wines[index].id);
            expect(wine.name).toEqual(store.wines[index].name);
            expect(wine.year).toEqual(store.wines[index].year);
            expect(wine.grapeVariety).toEqual(store.wines[index].grapeVariety);
            expect(wine.heritage).toEqual(store.wines[index].heritage);
            expect(wine.createdAt).toEqual(
              store.wines[index].createdAt.toISOString(),
            );
            expect(wine.updatedAt).toEqual(
              store.wines[index].updatedAt.toISOString(),
            );
          });
        });
    });

    it(`should return ${HttpStatus.OK} and no wines with authorization`, async () => {
      const store = await storesService.create(
        faker.company.name(),
        faker.location.streetAddress(),
        faker.internet.url(),
      );
      return request(app.getHttpServer())
        .get(STORES_ID_ENDPOINT.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.wines).toEqual([]);
        });
    });
  });

  describe(STORES_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data and with authorization`, async () => {
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and with authorization`, async () => {
      const invalidData = {
        name: 123,
      };
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .send(invalidData)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} with max valid data`, () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        url: faker.internet.url(),
      };
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} with min valid data`, () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
      };
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} a valid store with valid data`, () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        url: faker.internet.url(),
      };
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toEqual(validData.name);
          expect(body.address).toEqual(validData.address);
          expect(body.url).toEqual(validData.url);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
        });
    });

    it(`should return ${HttpStatus.CREATED} and no wines with authorization`, async () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        url: faker.internet.url(),
      };
      return request(app.getHttpServer())
        .post(STORES_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(Array.isArray(body.wines)).toBe(true);
          expect((body.wines as Array<any>).length).toBe(0);
        });
    });
  });
});
