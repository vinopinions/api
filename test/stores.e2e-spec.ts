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
import {
  PAGE_DEFAULT_VALUE,
  TAKE_DEFAULT_VALUE,
} from '../src/pagination/pagination-options.dto';
import { CreateStoreDto } from '../src/stores/dtos/create-store.dto';
import { Store } from '../src/stores/entities/store.entity';
import {
  STORES_ENDPOINT,
  STORES_ID_ENDPOINT,
  STORES_ID_WINES_ENDPOINT,
} from '../src/stores/stores.controller';
import { StoresService } from '../src/stores/stores.service';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { Wine } from '../src/wines/entities/wine.entity';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import {
  createTestStore,
  createTestWine,
  createTestWinemaker,
} from './common/creator.common';
import {
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
  invalidUUIDTest,
} from './common/tests.common';

import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

import { ConfigService } from '@nestjs/config';
import {
  ExpectedRatingResponse,
  ExpectedStoreResponse,
  ExpectedWineResponse,
  buildExpectedPageResponse,
  buildExpectedRatingResponse,
  buildExpectedStoreResponse,
  buildExpectedWineResponse,
} from './utils/expect-builder';
import { clearDatabase, createUser, deleteFirebaseUsers } from './utils/utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let firebaseApp: admin.app.App;
  let authHeader: Record<string, string>;
  let storesService: StoresService;
  let winesService: WinesService;
  let winemakersService: WinemakersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    winesService = app.get(WinesService);
    storesService = app.get(StoresService);
    winemakersService = app.get(WinemakersService);

    const configService: ConfigService = app.get(ConfigService);
    const firebaseServiceAccountFilePath: string = configService.getOrThrow(
      'FIREBASE_SERVICE_ACCOUNT_FILE',
    );

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseServiceAccountFilePath),
    });

    initializeFirebaseClient({
      apiKey: 'key',
    });

    const auth = getAuth();
    connectAuthEmulator(
      auth,
      'http://' + configService.getOrThrow('FIREBASE_AUTH_EMULATOR_HOST'),
      { disableWarnings: true },
    );
  });

  beforeEach(async () => {
    const loginData = await createUser(app);
    authHeader = loginData.authHeader;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await deleteFirebaseUsers(firebaseApp);
  });

  afterAll(async () => {
    await firebaseApp.delete();
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

    it(`should return ${HttpStatus.OK} and empty page response`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedStoreResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedStoreResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        await createTestStore(storesService);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedStoreResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedStoreResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid store`, async () => {
      const store: Store = await createTestStore(storesService);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedStoreResponse({
          id: store.id,
          name: store.name,
          address: store.address,
          url: store.url,
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
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
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
      const store = await createTestStore(storesService);

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
          createdAt: store.createdAt.toISOString(),
          updatedAt: store.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(STORES_ID_WINES_ENDPOINT + ' (GET)', () => {
    const endpoint: string = STORES_ID_WINES_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
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

    it(`should return ${HttpStatus.OK} and empty page response`, async () => {
      const store: Store = await createTestStore(storesService);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedRatingResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedRatingResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      const store: Store = await createTestStore(storesService);
      for (let i = 0; i < 10; i++) {
        await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          store,
        );
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedWineResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedWineResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid wine`, async () => {
      const store: Store = await createTestStore(storesService);
      const wine: Wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        store,
      );
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, store.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedWineResponse({
          id: wine.id,
          name: wine.name,
          heritage: wine.heritage,
          grapeVariety: wine.grapeVariety,
          year: wine.year,
          createdAt: wine.createdAt.toISOString(),
          updatedAt: wine.updatedAt.toISOString(),
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

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        exception: new BadRequestException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, async () => {
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
    });
  });
});
