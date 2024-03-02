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
import { Rating, STARS_MIN } from '../src/ratings/entities/rating.entity';
import {
  RATINGS_ENDPOINT,
  RATINGS_ID_ENDPOINT,
} from '../src/ratings/ratings.controller';
import { RatingsService } from '../src/ratings/ratings.service';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { Wine } from '../src/wines/entities/wine.entity';
import { WinesService } from '../src/wines/wines.service';
import {
  HttpMethod,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
  invalidUUIDTest,
} from './common/tests.common';
import { buildExpectedRatingResponse } from './utils/expect-builder';
import { clearDatabase, login } from './utils/utils';

describe('RatingsController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let user: User;
  let ratingsService: RatingsService;
  let winesService: WinesService;
  let winemakersService: WinemakersService;
  let storesService: StoresService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ratingsService = app.get(RatingsService);
    winesService = app.get(WinesService);
    winemakersService = app.get(WinemakersService);
    storesService = app.get(StoresService);

    const loginData = await login(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(RATINGS_ENDPOINT + ' (GET)', () => {
    const endpoint: string = RATINGS_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () => {
      await endpointExistTest({
        app,
        method,
        endpoint,
      });
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      });
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and rating object`, async () => {
      const rating: Rating = await createTestRating();
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        buildExpectedRatingResponse({
          id: rating.id,
          stars: rating.stars,
          text: rating.text,
          createdAt: rating.createdAt.toISOString(),
          updatedAt: rating.updatedAt.toISOString(),
          // TODO: Add wine
          // wine: {
          //   id: rating.wine.id
          // },
          user: {
            id: rating.user.id,
          },
        }),
      );
    });
  });

  describe(RATINGS_ID_ENDPOINT + ' (GET)', () => {
    const endpoint: string = RATINGS_ID_ENDPOINT;
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
      const rating: Rating = await createTestRating();
      const response: Response = await request(app.getHttpServer())
        .delete(endpoint.replace(ID_URL_PARAMETER, rating.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when looking for an uuid that doesn't exist`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          ID_URL_PARAMETER,
          faker.string.alphanumeric(10),
        ),
        header: authHeader,
        exception: new BadRequestException(),
      }));

    it(`should return ${HttpStatus.OK} and rating object`, async () => {
      const rating: Rating = await createTestRating();

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, rating.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedRatingResponse({
          id: rating.id,
          stars: rating.stars,
          text: rating.text,
          createdAt: rating.createdAt.toISOString(),
          updatedAt: rating.updatedAt.toISOString(),
          // TODO: Add wine
          // wine: {
          //   id: rating.wine.id
          // },
          user: {
            id: rating.user.id,
          },
        }),
      );
    });
  });

  describe(RATINGS_ID_ENDPOINT + ' (DELETE)', () => {
    const endpoint: string = RATINGS_ID_ENDPOINT;
    const method: HttpMethod = 'delete';

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
      const rating: Rating = await createTestRating();
      const response: Response = await request(app.getHttpServer())
        .delete(endpoint.replace(ID_URL_PARAMETER, rating.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a valid uuid`, async () =>
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with random uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.OK} when deleting a rating and should not exist anymore in the database after deletion`, async () => {
      const rating: Rating = await createTestRating();

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, rating.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(
        async () => await ratingsService.findOne({ where: { id: rating.id } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  const createTestRating = async (): Promise<Rating> => {
    const winemaker: Winemaker = await winemakersService.create(
      faker.person.fullName(),
    );
    const store: Store = await storesService.create(faker.company.name());
    const wine: Wine = await winesService.create(
      faker.word.noun(),
      faker.date.past().getFullYear(),
      winemaker.id,
      [store.id],
      faker.word.noun(),
      faker.location.country(),
    );

    return ratingsService.create(
      faker.number.int({ min: STARS_MIN, max: STARS_MIN }),
      faker.lorem.text(),
      user,
      wine,
    );
  };
});
