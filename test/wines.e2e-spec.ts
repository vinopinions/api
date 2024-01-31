import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { clearDatabase, login, setupWineRatingTest } from './utils';
import {
  WINES_ENDPOINT,
  WINES_ID_ENDPOINT,
  WINES_ID_RATINGS_ENDPOINT,
} from '../src/wines/wines.controller';
import request from 'supertest';
import { CreateWineDto } from '../src/wines/dtos/create-wine.dto';
import { CreateRatingDto } from '../src/ratings/dtos/create-rating.dto';
import { WinesService } from '../src/wines/wines.service';
import { RatingsService } from '../src/ratings/ratings.service';

describe('WinesController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let winesService: WinesService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    winesService = app.get<WinesService>(WinesService);

    const loginData = await login(app);
    authHeader = loginData.authHeader;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => clearDatabase(app));

  describe('GET ' + WINES_ENDPOINT, () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK}`, async () => {
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });

    /*
    it(`should return ${HttpStatus.OK} and array with size of 4 with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);

      // just create 3 since one is created during setup
      for (let i = 0; i < 3; i++) {
        const wine: CreateWineDto = {
          name: 'wine' + i,
          grapeVariety: 'Riesling ' + i,
          heritage: 'Deutschland ' + i,
          year: i,
          storeIds: [setupData.storeId],
          winemakerId: setupData.winemakerId,
        };
        await winesService.create(wine);
      }

      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect((response) => {
          expect(response.status === HttpStatus.OK);
          expect((response.body as Array<any>).length).toBe(4);
          (response.body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.name).toBeDefined();
            expect(item.year).toBeDefined();
            expect(item.grapeVariety).toBeDefined();
            expect(item.heritage).toBeDefined();
            expect((item.stores as Array<any>).length).toBe(1);
            (item.stores as Array<any>).forEach((store) => {
              expect(store.id).toBeDefined();
              expect(store.name).toBeDefined();
            });
          });
        });
    });
    */
  });

  describe('GET ' + WINES_ID_RATINGS_ENDPOINT, () => {
    it('should exist', async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.wineId + '/ratings')
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.wineId + '/ratings')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.wineId + '/ratings')
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });
  });

  describe('POST ' + WINES_ENDPOINT, () => {
    it(`should return ${HttpStatus.CREATED}`, () => {
      const createWineDto: CreateWineDto = {
        name: 'Wine',
        grapeVariety: 'Grapes',
        heritage: 'Germany',
        year: 2021,
        winemakerId: '1',
        storeIds: ['1'],
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .set(authHeader)
        .send(createWineDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} when required field is missing`, () => {
      // name is missing
      const wineObject = {
        year: 2020,
        grapeVariety: 'Grapes',
        haritage: 'Germany',
      };

      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .send(wineObject)
        .expect((response) => response.status === HttpStatus.BAD_REQUEST);
    });
  });

  describe(`POST ${WINES_ID_RATINGS_ENDPOINT}`, () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(WINES_ID_RATINGS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const setupData = await setupWineRatingTest(app);

      return request(app.getHttpServer())
        .get(`${WINES_ENDPOINT}/${setupData.wineId}/ratings`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);

      return request(app.getHttpServer())
        .get(`${WINES_ENDPOINT}/${setupData.wineId}/ratings`)
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });

    it(`should return ${HttpStatus.CREATED} with valid request body`, async () => {
      const setupData = await setupWineRatingTest(app);

      const createRatingDto: CreateRatingDto = {
        stars: 5,
        text: 'tasty',
      };

      return request(app.getHttpServer())
        .post(`${WINES_ENDPOINT}/${setupData.wineId}/ratings`)
        .set(authHeader)
        .send(createRatingDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });
  });

  describe(`PUT ` + WINES_ID_ENDPOINT, () => {
    it(`should return ${HttpStatus.OK} when changed with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
    });
  });
});
