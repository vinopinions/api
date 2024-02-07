import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ID_URL_PARAMETER } from '../src/constants/url-parameter';
import { CreateWinemakerDto } from '../src/winemakers/dtos/create-winemaker.dto';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { AppModule } from './../src/app.module';
import {
  WINEMAKERS_ENDPOINT,
  WINEMAKERS_ID_ENDPOINT,
} from './../src/winemakers/winemakers.controller';
import { clearDatabase, isErrorResponse, login } from './utils';
import { StoresService } from '../src/stores/stores.service';
import { WinesService } from '../src/wines/wines.service';
import { Store } from '../src/stores/entities/store.entity';

describe('WinemakersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let winemakersService: WinemakersService;
  let storesService: StoresService;
  let winesService: WinesService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    winemakersService = app.get(WinemakersService);
    storesService = app.get(StoresService);
    winesService = app.get(WinesService);
    const loginData = await login(app);
    authHeader = loginData.authHeader;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(WINEMAKERS_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and  array with length of 0 with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .set(authHeader)

        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        const name = faker.person.fullName();
        await winemakersService.create(name);
      }

      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} and 10 valid winemakers with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        const name = faker.person.fullName();
        await winemakersService.create(name);
      }
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(10);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.name).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it(`should return ${HttpStatus.OK} and a winemaker with no relations with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.wines).toBeUndefined();
        });
    });
  });

  describe(WINEMAKERS_ID_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(
          WINEMAKERS_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          WINEMAKERS_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          WINEMAKERS_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          WINEMAKERS_ID_ENDPOINT.replace(
            ID_URL_PARAMETER,
            faker.string.alphanumeric(10),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} and a valid winemaker including wines relation if id parameter is valid with authorization`, async () => {
      const winemaker: Winemaker = await winemakersService.create(
        faker.person.fullName(),
      );
      const wines = [];
      for (let i = 0; i < 3; i++) {
        const store: Store = await storesService.create(faker.company.name());
        wines.push(
          await winesService.create(
            faker.word.noun(),
            faker.date.past().getFullYear(),
            winemaker.id,
            [store.id],
            faker.word.noun(),
            faker.location.country(),
          ),
        );
      }
      winemaker.wines = wines;
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(ID_URL_PARAMETER, winemaker.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(winemaker.id);
          expect(body.name).toEqual(winemaker.name);
          expect(body.createdAt).toEqual(winemaker.createdAt.toISOString());
          expect(body.updatedAt).toEqual(winemaker.updatedAt.toISOString());
          (body.wines as Array<any>).forEach((wine, index) => {
            expect(wine.id).toEqual(winemaker.wines[index].id);
            expect(wine.name).toEqual(winemaker.wines[index].name);
            expect(wine.year).toEqual(winemaker.wines[index].year);
            expect(wine.grapeVariety).toEqual(
              winemaker.wines[index].grapeVariety,
            );
            expect(wine.heritage).toEqual(winemaker.wines[index].heritage);
            expect(wine.createdAt).toEqual(
              winemaker.wines[index].createdAt.toISOString(),
            );
            expect(wine.updatedAt).toEqual(
              winemaker.wines[index].updatedAt.toISOString(),
            );
          });
        });
    });
  });

  describe(WINEMAKERS_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data and with authorization`, async () => {
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and with authorization`, async () => {
      const invalidData = {
        name: 123,
      };
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .send(invalidData)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} with valid data`, () => {
      const validData: CreateWinemakerDto = {
        name: faker.person.fullName(),
      };
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} a valid winemaker with valid data`, () => {
      const validData: CreateWinemakerDto = {
        name: faker.person.fullName(),
      };
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBeDefined();
          expect(body.name).toEqual(validData.name);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
        });
    });

    it(`should return ${HttpStatus.CREATED} and no wines with authorization`, async () => {
      const validData: CreateWinemakerDto = {
        name: faker.person.fullName(),
      };
      return request(app.getHttpServer())
        .post(WINEMAKERS_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.wines).toBeUndefined();
        });
    });
  });
});
