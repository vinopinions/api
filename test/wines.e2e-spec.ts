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
import { User } from '../src/users/entities/user.entity';
import { response } from 'express';
import { AddStoreToWineDto } from '../src/wines/dtos/add-store-to-wine.dto';
import { CreateStoreDto } from '../src/stores/dtos/create-store.dto';
import { StoresService } from '../src/stores/stores.service';
import { v4 as uuidv4 } from 'uuid';

describe('WinesController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let user: User;
  let winesService: WinesService;
  let storesService: StoresService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    winesService = app.get(WinesService);
    storesService = app.get(StoresService);

    const loginData = await login(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

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

    it(`should return ${HttpStatus.OK} and wine with store relation with authorization`, async () => {
      await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
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

  describe('GET ' + WINES_ID_RATINGS_ENDPOINT, () => {
    it('should exist', async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.createdWine.id + '/ratings')
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.createdWine.id + '/ratings')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .get(WINES_ENDPOINT + '/' + setupData.createdWine.id + '/ratings')
        .set(authHeader)
        .expect((response) => response.status === HttpStatus.OK);
    });
  });

  describe('POST ' + WINES_ENDPOINT, () => {
    it('should exist', async () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, () => {
      return request(app.getHttpServer())
        .post(WINES_ENDPOINT)
        .expect((response) => response.status === HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.CREATED} with authorization`, () => {
      const createWineDto: CreateWineDto = {
        name: 'Wine',
        grapeVariety: 'Grapes',
        heritage: 'Germany',
        year: 2021,
        winemakerId: uuidv4(),
        storeIds: [uuidv4()],
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
        .post(WINES_ID_RATINGS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const setupData = await setupWineRatingTest(app);

      return request(app.getHttpServer())
        .post(`${WINES_ENDPOINT}/${setupData.createdWine.id}/ratings`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);

      return request(app.getHttpServer())
        .post(`${WINES_ENDPOINT}/${setupData.createdWine.id}/ratings`)
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
        .post(`${WINES_ENDPOINT}/${setupData.createdWine.id}/ratings`)
        .set(authHeader)
        .send(createRatingDto)
        .expect((response) => response.status === HttpStatus.CREATED);
    });
  });

  describe(`PUT ` + WINES_ID_ENDPOINT, () => {
    it('should exist', async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .put(WINES_ENDPOINT + '/' + setupData.createdWine.id)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .put(WINES_ENDPOINT + '/' + setupData.createdWine.id)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      return request(app.getHttpServer())
        .put(WINES_ENDPOINT + '/' + setupData.createdWine.id)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} when changed with authorization`, async () => {
      const setupData = await setupWineRatingTest(app);
      const store: CreateStoreDto = {
        name: 'new Store',
      };

      const newStoreId = (await storesService.create(store)).id;

      const addStoreToWineDto: CreateWineDto = {
        name: setupData.createdWine.name,
        grapeVariety: setupData.createdWine.grapeVariety,
        heritage: setupData.createdWine.heritage,
        year: setupData.createdWine.year,
        winemakerId: setupData.createdWine.winemaker.id,
        storeIds: [setupData.storeId, newStoreId],
      };

      return request(app.getHttpServer())
        .put(WINES_ENDPOINT + '/' + setupData.createdWine.id)
        .set(authHeader)
        .send(addStoreToWineDto)
        .expect((response) => {
          expect(response.status === HttpStatus.OK);
          expect((response.body.stores as Array<any>).length).toBe(2);
        });
    });
  });
});
