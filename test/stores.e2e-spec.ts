import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
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
import {
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
  invalidUUIDTest,
} from './common/tests.common';
import { buildExpectedStoreResponse } from './utils/expect-builder';
import { clearDatabase, login } from './utils/utils';

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
    const endpoint: string = STORES_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and array with length of 0`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and array with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        await storesService.create(
          faker.company.name(),
          faker.location.streetAddress(),
          faker.internet.url(),
        );
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} and a store`, async () => {
      const store = await storesService.create(
        faker.company.name(),
        faker.location.streetAddress(),
        faker.internet.url(),
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        buildExpectedStoreResponse({
          id: store.id,
          name: store.name,
          address: store.address,
          url: store.url,
          wines: store.wines.map((wine) => {
            return {
              id: wine.id,
            };
          }),
          createdAt: store.createdAt.toISOString(),
          updatedAt: store.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(STORES_ID_ENDPOINT + ' (GET)', () => {
    const endpoint: string = STORES_ID_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a valid uuid`, async () =>
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      }));

    it(`should return ${HttpStatus.OK} and a valid store if id parameter is valid`, async () => {
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

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedStoreResponse({
          id: store.id,
          name: store.name,
          address: store.address,
          url: store.url,
          wines: store.wines.map((wine) => {
            return {
              id: wine.id,
            };
          }),
          createdAt: store.createdAt.toISOString(),
          updatedAt: store.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(STORES_ENDPOINT + ' (POST)', () => {
    const endpoint: string = STORES_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} with authorization`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        exception: new BadRequestException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and with authorization`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          name: 123,
        },
        exception: new BadRequestException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.CREATED} with max valid data`, async () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        url: faker.internet.url(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} with min valid data`, async () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} a valid store with valid data`, async () => {
      const validData: CreateStoreDto = {
        name: faker.person.fullName(),
        address: faker.location.streetAddress(),
        url: faker.internet.url(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(buildExpectedStoreResponse({ wines: [] }));
    });
  });
});
