import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { FEED_ENDPOINT } from '../src/feed/feed.controller';
import {
  PAGE_DEFAULT_VALUE,
  TAKE_DEFAULT_VALUE,
} from '../src/pagination/pagination-options.dto';
import { STARS_MAX, STARS_MIN } from '../src/ratings/entities/rating.entity';
import { RatingsService } from '../src/ratings/ratings.service';
import { Store } from '../src/stores/entities/store.entity';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';
import { Winemaker } from '../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { Wine } from '../src/wines/entities/wine.entity';
import { WinesService } from '../src/wines/wines.service';
import {
  HttpMethod,
  endpointExistTest,
  endpointProtectedTest,
} from './common/tests.common';
import {
  ExpectedRatingResponse,
  buildExpectedPageResponse,
  buildExpectedRatingResponse,
} from './utils/expect-builder';
import {
  clearDatabase,
  createUser,
  deleteFirebaseUsers,
  generateRandomValidUsername,
} from './utils/utils';

describe('FeedController (e2e)', () => {
  let app: INestApplication;
  let firebaseApp: admin.app.App;
  let authHeader: Record<string, string>;
  let user: User;
  let winesService: WinesService;
  let storesService: StoresService;
  let winemakersService: WinemakersService;
  let usersService: UsersService;
  let ratingsService: RatingsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    winesService = app.get(WinesService);
    storesService = app.get(StoresService);
    winemakersService = app.get(WinemakersService);
    usersService = app.get(UsersService);
    ratingsService = app.get(RatingsService);

    const configService: ConfigService = app.get(ConfigService);
    firebaseApp = admin.initializeApp();

    initializeFirebaseClient({
      apiKey: 'key',
    });

    connectAuthEmulator(
      getAuth(),
      'http://' + configService.getOrThrow('FIREBASE_AUTH_EMULATOR_HOST'),
      { disableWarnings: true },
    );
  });

  beforeEach(async () => {
    const loginData = await createUser(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await deleteFirebaseUsers(firebaseApp);
  });

  afterAll(async () => {
    await firebaseApp.delete();
    await app.close();
  });

  describe(FEED_ENDPOINT + ' (GET)', () => {
    const endpoint: string = FEED_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({ app, method, endpoint: endpoint }));

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
    });

    it.each([
      { friendAmount: 1, ratingsPerFriend: 5, take: 10 },
      { friendAmount: 3, ratingsPerFriend: 5, take: 10 },
      { friendAmount: 3, ratingsPerFriend: 5, take: 20 },
    ])(
      `should return ${HttpStatus.OK} with $friendAmount friends, $ratingsPerFriend and $take take page response`,
      async ({ friendAmount, ratingsPerFriend, take }) => {
        // create wines
        const wines: Wine[] = [];
        for (let i = 0; i < ratingsPerFriend; i++) {
          const winemaker: Winemaker = await winemakersService.create(
            faker.person.fullName(),
          );
          const store: Store = await storesService.create(faker.company.name());
          wines.push(
            await winesService.create(
              faker.word.noun(),
              faker.date.past().getFullYear(),
              winemaker.id,
              [store.id],
              faker.word.noun(),
              faker.location.country(),
            ),
          );
        }

        for (let i = 0; i < friendAmount; i++) {
          // create user (friend)
          const friend: User = await usersService.create(
            generateRandomValidUsername(),
            faker.internet.password(),
          );

          // add friends
          await usersService.addFriend(user, friend);

          // let the friend rate all wines
          for (let i = 0; i < wines.length; i++) {
            await ratingsService.create(
              faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
              faker.lorem.sentence(),
              friend,
              wines[i],
            );
          }
        }

        const response: Response = await request(app.getHttpServer())
          [method](endpoint + '?take=' + take)
          .set(authHeader);

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toEqual(
          buildExpectedPageResponse<ExpectedRatingResponse>({
            meta: {
              take,
              itemCount: friendAmount * ratingsPerFriend,
            },
            buildExpectedResponse: buildExpectedRatingResponse,
          }),
        );
        expect(response.body.data).toHaveLength(
          Math.min(friendAmount * ratingsPerFriend, take),
        );
      },
    );
  });
});
