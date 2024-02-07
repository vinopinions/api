import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
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
import { clearDatabase, isErrorResponse, login } from './utils';

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
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK}`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and wine with authorization`, async () => {
      await createTestWine();

      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.name).toBeDefined();
            expect(item.year).toBeDefined();
            expect(item.grapeVariety).toBeDefined();
            expect(item.heritage).toBeDefined();
          });
        });
    });
  });

  describe(WINES_ID_ENDPOINT + ' (GET)', () => {
    it('should exist', async () => {
      const wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and wine including its winemaker, stores and ratings`, async () => {
      const wine: Wine = await createTestWine();
      const rating: Rating = await ratingsService.create(
        faker.number.int({ min: 1, max: 5 }),
        faker.lorem.text(),
        user,
        wine,
      );
      wine.ratings = [rating];

      return request(app.getHttpServer())
        .get(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(wine.id);
          expect(body.name).toEqual(wine.name);
          expect(body.year).toEqual(wine.year);
          expect(body.grapeVariety).toEqual(wine.grapeVariety);
          expect(body.heritage).toEqual(wine.heritage);
          expect(body.createdAt).toEqual(wine.createdAt.toISOString());
          expect(body.updatedAt).toEqual(wine.updatedAt.toISOString());
          expect(body.winemaker.id).toEqual(wine.winemaker.id);
          expect(body.winemaker.name).toEqual(wine.winemaker.name);
          expect(body.winemaker.createdAt).toEqual(
            wine.winemaker.createdAt.toISOString(),
          );
          expect(body.winemaker.updatedAt).toEqual(
            wine.winemaker.updatedAt.toISOString(),
          );
          (body.stores as Array<any>).forEach((store, index) => {
            expect(store.id).toEqual(wine.stores[index].id);
            expect(store.name).toEqual(wine.stores[index].name);
            expect(store.address).toEqual(wine.stores[index].address);
            expect(store.url).toEqual(wine.stores[index].url);
            expect(store.createdAt).toEqual(
              wine.stores[index].createdAt.toISOString(),
            );
            expect(store.updatedAt).toEqual(
              wine.stores[index].updatedAt.toISOString(),
            );
          });
          (body.ratings as Array<any>).forEach((rating, index) => {
            expect(rating.id).toEqual(wine.ratings[index].id);
            expect(rating.stars).toEqual(wine.ratings[index].stars);
            expect(rating.text).toEqual(wine.ratings[index].text);
            expect(rating.createdAt).toEqual(
              wine.ratings[index].createdAt.toISOString(),
            );
            expect(rating.updatedAt).toEqual(
              wine.ratings[index].updatedAt.toISOString(),
            );
          });
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random id parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, faker.string.uuid()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with malformed uuid`, async () => {
      return request(app.getHttpServer())
        .get(
          WINES_ID_ENDPOINT.replace(
            ID_URL_PARAMETER,
            faker.number.int().toString(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });
  });

  describe(WINES_ENDPOINT + ' (POST)', () => {
    it('should exist', async () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} with authorization`, async () => {
      const store: Store = await storesService.create(faker.company.name());
      const winemaker = await winemakersService.create(faker.person.fullName());
      const createWineDto: CreateWineDto = {
        name: faker.word.noun(),
        year: faker.date.past().getFullYear(),
        grapeVariety: faker.word.noun(),
        storeIds: [store.id],
        heritage: faker.location.country(),
        winemakerId: winemaker.id,
      };
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(createWineDto)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, async () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when required field is missing`, async () => {
      // name is missing
      const wineObject = {
        year: faker.date.past().getFullYear(),
        grapeVariety: faker.word.noun(),
        heritage: faker.location.country(),
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(wineObject)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
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

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(createWineDto)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });
  });

  describe(WINES_ID_RATINGS_ENDPOINT + '(POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data with authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid text data type with authorization`, async () => {
      const wine: Wine = await createTestWine();
      const invalidData = {
        stars: faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
        text: 1,
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'text'));
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid stars data type with authorization`, async () => {
      const wine: Wine = await createTestWine();
      const invalidData = {
        stars: 'abc',
        text: 'abc',
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'stars'));
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when stars are lower than ${STARS_MIN} data type with authorization`, async () => {
      const wine: Wine = await createTestWine();
      const invalidData = {
        stars: STARS_MIN - 1,
        text: 'abc',
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'stars'));
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when stars are higher than ${STARS_MAX} data type with authorization`, async () => {
      const wine: Wine = await createTestWine();
      const invalidData = {
        stars: STARS_MAX + 1,
        text: 'abc',
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'stars'));
    });

    it(`should return ${HttpStatus.CREATED} with valid request body`, async () => {
      const wine: Wine = await createTestWine();

      const createRatingDto: CreateRatingDto = {
        stars: STARS_MAX,
        text: faker.lorem.lines(),
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(createRatingDto)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CREATED} with valid request body and correct data`, async () => {
      const wine: Wine = await createTestWine();

      const createRatingDto: CreateRatingDto = {
        stars: STARS_MAX,
        text: faker.lorem.lines(),
      };

      return request(app.getHttpServer())
        .post(WINES_ID_RATINGS_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(createRatingDto)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.stars).toEqual(createRatingDto.stars);
          expect(body.text).toEqual(createRatingDto.text);
          expect(body.wine).toBeDefined();
          expect(body.wine.id).toEqual(wine.id);
          expect(body.updatedAt).toBeDefined();
          expect(body.createdAt).toBeDefined();
        });
    });
  });

  describe(WINES_ID_ENDPOINT + ' (PUT)', () => {
    it('should exist', async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data with authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when using random store ids with authorization`, async () => {
      const wine: Wine = await createTestWine();

      const updateWineDto: UpdateWineDto = {
        storeIds: [...wine.stores.map((e) => e.id), faker.string.uuid()],
      };

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(updateWineDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.OK} when changed with authorization`, async () => {
      const wine: Wine = await createTestWine();

      const store = await storesService.create(faker.company.name());
      const updateWineDto: UpdateWineDto = {
        storeIds: [...wine.stores.map((e) => e.id), store.id],
      };

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(ID_URL_PARAMETER, wine.id))
        .set(authHeader)
        .send(updateWineDto)
        .expect((response) => {
          expect(response.status === HttpStatus.OK);
          expect((response.body.stores as Array<any>).length).toBe(2);
        });
    });
  });

  const createTestWine = async (): Promise<Wine> => {
    const store: Store = await storesService.create(faker.company.name());
    const winemaker: Winemaker = await winemakersService.create(
      faker.person.fullName(),
    );

    return winesService.create(
      faker.word.noun(),
      faker.date.past().getFullYear(),
      winemaker.id,
      [store.id],
      faker.word.noun(),
      faker.location.country(),
    );
  };
});
