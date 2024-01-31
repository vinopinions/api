import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { AppModule } from './../src/app.module';
import {
  WINEMAKERS_ENDPOINT,
  WINEMAKERS_ID_ENDPOINT,
} from './../src/winemakers/winemakers.controller';
import { clearDatabase, isErrorResponse, login } from './utils';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';

describe('WinemakersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let winemakersService: WinemakersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    winemakersService = app.get<WinemakersService>(WinemakersService);
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
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', faker.string.alphanumeric()))
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} and a valid winemaker if id parameter is valid with authorization`, async () => {
      const winemaker: Winemaker = await winemakersService.create(
        faker.person.fullName(),
      );
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', winemaker.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(winemaker.id);
          expect(body.name).toEqual(winemaker.name);
          expect(body.createdAt).toEqual(winemaker.createdAt.toISOString());
          expect(body.updatedAt).toEqual(winemaker.updatedAt.toISOString());
        });
    });

    it(`should return ${HttpStatus.OK} and no wines with authorization`, async () => {
      const winemaker: Winemaker = await winemakersService.create(
        faker.person.fullName(),
      );
      return request(app.getHttpServer())
        .get(WINEMAKERS_ID_ENDPOINT.replace(':id', winemaker.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.wines).toBeUndefined();
        });
    });
  });
});
