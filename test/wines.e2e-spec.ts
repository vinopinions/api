import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateRatingDto } from '../src/ratings/dtos/create-rating.dto';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
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
import { clearDatabase, isErrorResponse, login } from './utils';

describe('WinesController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let storesService: StoresService;
  let winemakersService: WinemakersService;
  let winesService: WinesService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    storesService = app.get(StoresService);
    winemakersService = app.get(WinemakersService);
    winesService = app.get(WinesService);

    const loginData = await login(app);
    authHeader = loginData.authHeader;
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
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK}`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and wine with store relation with authorization`, async () => {
      await createTestWine();

      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.name).toBeDefined();
            expect(item.year).toBeDefined();
            expect(item.grapeVariety).toBeDefined();
            expect(item.heritage).toBeDefined();
            expect(item.stores).toBeDefined();
            (item.stores as Array<any>).forEach((store) => {
              expect(store.id).toBeDefined();
              expect(store.name).toBeDefined();
            });
          });
        });
    });
  });

  describe(WINES_ID_RATINGS_ENDPOINT + ' (GET)', () => {
    it('should exist', async () => {
      const wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_RATINGS_ENDPOINT.replace(':id', wine.id))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine: Wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_RATINGS_ENDPOINT.replace(':id', wine.id))
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const wine: Wine = await createTestWine();
      return request(app.getHttpServer())
        .get(WINES_ID_RATINGS_ENDPOINT.replace(':id', wine.id))
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
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
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} with authorization`, () => {
      const createWineDto: CreateWineDto = {
        name: faker.word.noun(),
        grapeVariety: faker.word.noun(),
        heritage: faker.location.country(),
        year: faker.date.past().getFullYear(),
        winemakerId: faker.string.uuid(),
        storeIds: [faker.string.uuid()],
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(createWineDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, async () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when required field is missing`, async () => {
      // name is missing
      const wineObject = {
        year: 2020,
        grapeVariety: 'Grapes',
        haritage: 'Germany',
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .send(wineObject)
        .expect((response) => response.status === HttpStatus.BAD_REQUEST)
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
        .post(`${WINES_ENDPOINT}/${wine.id}/ratings`)
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .post(`${WINES_ENDPOINT}/${wine.id}/ratings`)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });

    it(`should return ${HttpStatus.CREATED} with valid request body`, async () => {
      const wine: Wine = await createTestWine();

      const createRatingDto: CreateRatingDto = {
        stars: 5,
        text: 'tasty',
      };

      return request(app.getHttpServer())
        .post(`${WINES_ENDPOINT}/${wine.id}/ratings`)
        .set(authHeader)
        .send(createRatingDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });
  });

  describe(WINES_ID_ENDPOINT + ' (PUT)', () => {
    it('should exist', async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(':id', wine.id))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(':id', wine.id))
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const wine: Wine = await createTestWine();

      return request(app.getHttpServer())
        .put(WINES_ID_ENDPOINT.replace(':id', wine.id))
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} when changed with authorization`, async () => {
      const wine: Wine = await createTestWine();
      const storeName = faker.company.name();

      const store = await storesService.create(storeName);

      const addStoreToWineDto: CreateWineDto = {
        name: wine.name,
        grapeVariety: wine.grapeVariety,
        heritage: wine.heritage,
        year: wine.year,
        winemakerId: wine.winemaker.id,
        storeIds: [...wine.stores.map((store) => store.id), store.id],
      };

      return request(app.getHttpServer())
        .put(WINES_ENDPOINT + '/' + wine.id)
        .set(authHeader)
        .send(addStoreToWineDto)
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
