import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { ID_URL_PARAMETER } from '../src/constants/url-parameter';
import { CreateRatingDto } from '../src/ratings/dtos/create-rating.dto';
import {
  Rating,
  STARS_MAX,
  STARS_MIN,
} from '../src/ratings/entities/rating.entity';
import { RatingsService } from '../src/ratings/ratings.service';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { CreateWineDto } from '../src/wines/dtos/create-wine.dto';
import { Wine } from '../src/wines/entities/wine.entity';
import {
  WINES_ENDPOINT,
  WINES_ID_ENDPOINT,
  WINES_ID_RATINGS_ENDPOINT,
} from '../src/wines/wines.controller';
import { WinesService } from '../src/wines/wines.service';
import { UpdateWineDto } from './../src/wines/dtos/update-wine.dto';
import {
  createTestRating,
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
  buildExpectedRatingResponse,
  buildExpectedWineResponse,
} from './utils/expect-builder';
import { clearDatabase, login } from './utils/utils';

describe('WinesController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let user: User;
  let storesService: StoresService;
  let winemakersService: WinemakersService;
  let winesService: WinesService;
  let ratingsService: RatingsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    storesService = app.get(StoresService);
    winemakersService = app.get(WinemakersService);
    winesService = app.get(WinesService);
    ratingsService = app.get(RatingsService);

    const loginData = await login(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(WINES_ENDPOINT + ' (GET)', () => {
    const endpoint: string = WINES_ENDPOINT;
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
        await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} and wine with authorization`, async () => {
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);
      const store: Store = await createTestStore(storesService);
      const wine: Wine = await createTestWine(winesService, winemaker, store);
      const rating: Rating = await createTestRating(ratingsService, user, wine);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        buildExpectedWineResponse({
          id: wine.id,
          grapeVariety: wine.grapeVariety,
          heritage: wine.heritage,
          name: wine.name,
          year: wine.year,
          winemaker: {
            id: winemaker.id,
          },
          ratings: [
            {
              id: rating.id,
            },
          ],
          stores: [
            {
              id: store.id,
            },
          ],
          createdAt: wine.createdAt.toISOString(),
          updatedAt: wine.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(WINES_ID_ENDPOINT + ' (GET)', () => {
    const endpoint: string = WINES_ID_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
      });
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
      });
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and wine including its winemaker, stores and ratings`, async () => {
      const winemaker: Winemaker = await createTestWinemaker(winemakersService);
      const store: Store = await createTestStore(storesService);
      const wine: Wine = await createTestWine(winesService, winemaker, store);
      const rating: Rating = await createTestRating(ratingsService, user, wine);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedWineResponse({
          id: wine.id,
          grapeVariety: wine.grapeVariety,
          heritage: wine.heritage,
          name: wine.name,
          year: wine.year,
          winemaker: {
            id: winemaker.id,
          },
          ratings: [
            {
              id: rating.id,
            },
          ],
          stores: [
            {
              id: store.id,
            },
          ],
          createdAt: wine.createdAt.toISOString(),
          updatedAt: wine.updatedAt.toISOString(),
        }),
      );
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random id parameter with authorization`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with malformed uuid`, async () => {
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      });
    });
  });

  describe(WINES_ENDPOINT + ' (POST)', () => {
    const endpoint: string = WINES_ENDPOINT;
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

    it(`should return ${HttpStatus.CREATED} with authorization`, async () => {
      const store: Store = await createTestStore(storesService);
      const winemaker = await createTestWinemaker(winemakersService);

      const validData: CreateWineDto = {
        name: faker.word.noun(),
        year: faker.date.past().getFullYear(),
        grapeVariety: faker.word.noun(),
        storeIds: [store.id],
        heritage: faker.location.country(),
        winemakerId: winemaker.id,
      };

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
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

    it(`should return ${HttpStatus.NOT_FOUND} when store ids are random`, async () => {
      const createWineDto: CreateWineDto = {
        name: faker.word.noun(),
        year: faker.date.past().getFullYear(),
        grapeVariety: faker.word.noun(),
        storeIds: [faker.string.uuid()],
        heritage: faker.location.country(),
        winemakerId: faker.string.uuid(),
      };

      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: createWineDto,
        exception: new BadRequestException(),
        header: authHeader,
      });
    });
  });

  describe(WINES_ID_RATINGS_ENDPOINT + '(POST)', () => {
    const endpoint: string = WINES_ID_RATINGS_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
      });
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with authorization`, async () => {
      const wine = await createTestWine(
        winesService,
        await createTestWinemaker(winemakersService),
        await createTestStore(storesService),
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with malformed uuid`, async () => {
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      });

      it(`should return ${HttpStatus.BAD_REQUEST} with invalid text data type`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        const invalidData = {
          stars: faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
          text: 1,
        };

        await complexExceptionThrownMessageStringTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
          body: invalidData,
          header: authHeader,
          exception: new BadRequestException(),
        });
      });

      it(`should return ${HttpStatus.BAD_REQUEST} with invalid stars data type with authorization`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        const invalidData = {
          stars: 'abc',
          text: 'abc',
        };

        await complexExceptionThrownMessageStringTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
          body: invalidData,
          header: authHeader,
          exception: new BadRequestException(),
        });
      });

      it(`should return ${HttpStatus.BAD_REQUEST} when stars are lower than ${STARS_MIN} data type with authorization`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        const invalidData = {
          stars: STARS_MIN - 1,
          text: 'abc',
        };

        await complexExceptionThrownMessageStringTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
          body: invalidData,
          header: authHeader,
          exception: new BadRequestException(),
        });
      });

      it(`should return ${HttpStatus.BAD_REQUEST} when stars are higher than ${STARS_MAX} data type with authorization`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        const invalidData = {
          stars: STARS_MAX + 1,
          text: 'abc',
        };

        await complexExceptionThrownMessageStringTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
          body: invalidData,
          header: authHeader,
          exception: new BadRequestException(),
        });
      });

      it(`should return ${HttpStatus.CREATED} with valid request body`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );

        const createRatingDto: CreateRatingDto = {
          stars: STARS_MAX,
          text: faker.lorem.lines(),
        };

        const response: Response = await request(app.getHttpServer())
          [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
          .set(authHeader)
          .send(createRatingDto);

        expect(response.status).toBe(HttpStatus.CREATED);
      });

      it(`should return ${HttpStatus.CREATED} and correct data`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );

        const data: CreateRatingDto = {
          stars: STARS_MAX,
          text: faker.lorem.lines(),
        };

        const response: Response = await request(app.getHttpServer())
          [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
          .set(authHeader)
          .send(data);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toBe(
          buildExpectedRatingResponse({
            stars: data.stars,
            text: data.text,
            user: {
              id: user.id,
            },
            wine: {
              id: wine.id,
            },
          }),
        );
      });
    });

    describe(WINES_ID_ENDPOINT + ' (PUT)', () => {
      const endpoint: string = WINES_ID_RATINGS_ENDPOINT;
      const method: HttpMethod = 'put';

      it('should exist', async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        await endpointExistTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
        });
      });

      it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        await endpointProtectedTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, wine.id),
        });
      });

      it(`should return ${HttpStatus.BAD_REQUEST} with authorization`, async () => {
        const wine = await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        );
        const response: Response = await request(app.getHttpServer())
          [method](endpoint.replace(ID_URL_PARAMETER, wine.id))
          .set(authHeader);

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });

      it(`should return ${HttpStatus.NOT_FOUND} with random id parameter`, async () => {
        await complexExceptionThrownMessageStringTest({
          app,
          method,
          endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
          header: authHeader,
          exception: new NotFoundException(),
        });
      });

      it(`should return ${HttpStatus.OK} when changed`, async () => {
        const winemaker: Winemaker =
          await createTestWinemaker(winemakersService);
        const store: Store = await createTestStore(storesService);
        const wine = await createTestWine(winesService, winemaker, store);

        const newStore = await storesService.create(faker.company.name());
        const updateWineDto: UpdateWineDto = {
          storeIds: [...wine.stores.map((e) => e.id), newStore.id],
        };

        const response: Response = await request(app.getHttpServer())
          .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
          .set(authHeader)
          .send(updateWineDto);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
          buildExpectedWineResponse({
            id: wine.id,
            grapeVariety: wine.grapeVariety,
            heritage: wine.heritage,
            name: wine.name,
            year: wine.year,
            winemaker: {
              id: winemaker.id,
            },
            ratings: [],
            stores: [
              {
                id: store.id,
              },
              //  {id: newStore.id}
            ],
            createdAt: wine.createdAt.toISOString(),
            updatedAt: wine.updatedAt.toISOString(),
          }),
        );
      });
    });
  });
});
