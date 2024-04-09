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

import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

import { ConfigService } from '@nestjs/config';
import {
  PAGE_DEFAULT_VALUE,
  TAKE_DEFAULT_VALUE,
} from '../src/pagination/pagination-options.dto';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
import { CreateWinemakerDto } from '../src/winemakers/dtos/create-winemaker.dto';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { Wine } from '../src/wines/entities/wine.entity';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import {
  WINEMAKERS_ENDPOINT,
  WINEMAKERS_ID_ENDPOINT,
  WINEMAKERS_ID_WINES_ENDPOINT,
} from './../src/winemakers/winemakers.controller';
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
import {
  ExpectedWineResponse,
  ExpectedWinemakerResponse,
  buildExpectedPageResponse,
  buildExpectedWineResponse,
  buildExpectedWinemakerResponse,
} from './utils/expect-builder';
import { clearDatabase, createUser, deleteFirebaseUsers } from './utils/utils';

describe('WinemakersController (e2e)', () => {
  let app: INestApplication;
  let firebaseApp: admin.app.App;
  let authHeader: Record<string, string>;
  let winemakersService: WinemakersService;
  let storesService: StoresService;
  let winesService: WinesService;

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

  describe(WINEMAKERS_ENDPOINT + ' (GET)', () => {
    const endpoint: string = WINEMAKERS_ENDPOINT;
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
        buildExpectedPageResponse<ExpectedWinemakerResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedWinemakerResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        await createTestWinemaker(winemakersService);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedWinemakerResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedWinemakerResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid winemaker`, async () => {
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedWinemakerResponse({
          id: winemaker.id,
          name: winemaker.name,
          createdAt: winemaker.createdAt.toISOString(),
          updatedAt: winemaker.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(WINEMAKERS_ID_ENDPOINT + ' (GET)', () => {
    const endpoint: string = WINEMAKERS_ID_ENDPOINT;
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

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a valid uuid`, async () =>
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      }));

    it(`should return ${HttpStatus.OK} and a valid winemaker including wines relation if id parameter is valid`, async () => {
      let winemaker: Winemaker = await winemakersService.create(
        faker.person.fullName(),
      );
      for (let i = 0; i < 3; i++) {
        const store: Store = await storesService.create(faker.company.name());
        await winesService.create(
          faker.word.noun(),
          faker.date.past().getFullYear(),
          winemaker.id,
          [store.id],
          faker.word.noun(),
          faker.location.country(),
        );
      }
      winemaker = await winemakersService.findOne({
        where: { id: winemaker.id },
      });

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, winemaker.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedWinemakerResponse({
          id: winemaker.id,
          name: winemaker.name,
          createdAt: winemaker.createdAt.toISOString(),
          updatedAt: winemaker.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(WINEMAKERS_ID_WINES_ENDPOINT + ' (GET)', () => {
    const endpoint: string = WINEMAKERS_ID_WINES_ENDPOINT;
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
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, winemaker.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedWineResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedWineResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);
      for (let i = 0; i < 10; i++) {
        await createTestWine(
          winesService,
          winemaker,
          await createTestStore(storesService),
        );
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, winemaker.id))
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
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);
      const wine: Wine = await createTestWine(
        winesService,
        winemaker,
        await createTestStore(storesService),
      );
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, winemaker.id))
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

  describe(WINEMAKERS_ENDPOINT + ' (POST)', () => {
    const endpoint: string = WINEMAKERS_ENDPOINT;
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

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and`, async () => {
      const invalidData = {
        name: 123,
      };
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: invalidData,
        exception: new BadRequestException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.CREATED} with valid data`, async () => {
      const validData: CreateWinemakerDto = {
        name: faker.person.fullName(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} and a valid winemaker with valid data`, async () => {
      const validData: CreateWinemakerDto = {
        name: faker.person.fullName(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
      buildExpectedWinemakerResponse({
        name: validData.name,
      });
    });
  });
});
