import {
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../src/users/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { clearDatabase, isErrorResponse, login } from './utils';
import {
  RATINGS_ENDPOINT,
  RATINGS_ID_ENDPOINT,
} from '../src/ratings/ratings.controller';
import request from 'supertest';
import { Rating, STARS_MIN } from '../src/ratings/entities/rating.entity';
import { WinesService } from '../src/wines/wines.service';
import { RatingsService } from '../src/ratings/ratings.service';
import { faker } from '@faker-js/faker';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { StoresService } from '../src/stores/stores.service';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { Store } from '../src/stores/entities/store.entity';
import { Wine } from '../src/wines/entities/wine.entity';

describe('RatingsController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
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
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(RATINGS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and rating object without any relations`, async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .get(RATINGS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toEqual(rating.id);
            expect(item.stars).toEqual(rating.stars);
            expect(item.text).toEqual(rating.text);
            expect(item.createdAt).toEqual(rating.createdAt.toISOString());
            expect(item.updatedAt).toEqual(rating.updatedAt.toISOString());
            expect(item.wine).toBeUndefined();
            expect(item.user).toBeUndefined();
          });
        });
    });

    it(`should return ${HttpStatus.OK} and array of ratings with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        await createTestRating();
      }

      return request(app.getHttpServer())
        .get(RATINGS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
          expect((body as Array<any>).length).toBe(10);
        });
    });
  });

  describe(RATINGS_ID_ENDPOINT + ' (GET)', () => {
    it('should exist', async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when looking for an uuid that doesn't exist`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', faker.string.alphanumeric(10)))
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => isErrorResponse(response, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} and rating object without relations`, async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(rating.id);
          expect(body.stars).toEqual(rating.stars);
          expect(body.text).toEqual(rating.text);
          expect(body.createdAt).toEqual(rating.createdAt.toISOString());
          expect(body.updatedAt).toEqual(rating.updatedAt.toISOString());
          expect(body.store).toBeUndefined();
          expect(body.user).toBeUndefined();
        });
    });
  });

  describe(RATINGS_ID_ENDPOINT + ' (DELETE)', () => {
    it('should exist', async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .delete(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .delete(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when looking for an uuid that doesn't exist`, async () => {
      return request(app.getHttpServer())
        .get(RATINGS_ID_ENDPOINT.replace(':id', faker.string.uuid()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .delete(
          RATINGS_ID_ENDPOINT.replace(':id', faker.string.alphanumeric(10)),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => isErrorResponse(response, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const rating: Rating = await createTestRating();
      return request(app.getHttpServer())
        .delete(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} when deleting a rating and should not exist anymore in the database after deletion`, async () => {
      const rating: Rating = await createTestRating();
      return await request(app.getHttpServer())
        .delete(RATINGS_ID_ENDPOINT.replace(':id', rating.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(async () => {
          expect(
            async () =>
              await ratingsService.findOne({ where: { id: rating.id } }),
          ).rejects.toThrow(NotFoundException);
        });
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
