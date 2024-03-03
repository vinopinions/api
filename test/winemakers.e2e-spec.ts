import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { ID_URL_PARAMETER } from '../src/constants/url-parameter';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
import { CreateWinemakerDto } from '../src/winemakers/dtos/create-winemaker.dto';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import {
  WINEMAKERS_ENDPOINT,
  WINEMAKERS_ID_ENDPOINT,
} from './../src/winemakers/winemakers.controller';
import {
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  endpointExistTest,
  endpointProtectedTest,
  invalidUUIDTest,
} from './common/tests.common';
import { buildExpectedWinemakerResponse } from './utils/expect-builder';
import { clearDatabase, login } from './utils/utils';

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

    it(`should return ${HttpStatus.OK} and array with length of 0`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        const name = faker.person.fullName();
        await winemakersService.create(name);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} and a winemaker`, async () => {
      const winemaker = await winemakersService.create(faker.person.fullName());

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        buildExpectedWinemakerResponse({
          id: winemaker.id,
          name: winemaker.name,
          wines: [],
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

    it(`should return ${HttpStatus.OK} and a valid winemaker including wines relation if id parameter is valid with authorization`, async () => {
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
          wines: winemaker.wines.map((wine) => {
            return {
              id: wine.id,
            };
          }),
          createdAt: winemaker.createdAt.toISOString(),
          updatedAt: winemaker.updatedAt.toISOString(),
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

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and with authorization`, async () => {
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
        wines: [],
      });
    });
  });
});
