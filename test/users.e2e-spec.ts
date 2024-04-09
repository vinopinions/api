import {
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import request, { Response } from 'supertest';
import { AuthService } from '../src/auth/auth.service';

import { ConfigService } from '@nestjs/config';
import {
  FRIEND_USERNAME_URL_PARAMETER,
  USERNAME_URL_PARAMETER,
} from '../src/constants/url-parameter';
import {
  PAGE_DEFAULT_VALUE,
  TAKE_DEFAULT_VALUE,
} from '../src/pagination/pagination-options.dto';
import { RatingsService } from '../src/ratings/ratings.service';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import {
  USERS_ENDPOINT,
  USERS_ME_ENDPOINT,
  USERS_USERNAME_ENDPOINT,
  USERS_USERNAME_FRIENDS_ENDPOINT,
  USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT,
  USERS_USERNAME_RATINGS_ENDPOINT,
} from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import {
  createTestRating,
  createTestStore,
  createTestWine,
  createTestWinemaker,
} from './common/creator.common';
import {
  HttpMethod,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
} from './common/tests.common';
import {
  ExpectedRatingResponse,
  ExpectedUserResponse,
  buildExpectedPageResponse,
  buildExpectedRatingResponse,
  buildExpectedUserResponse,
} from './utils/expect-builder';
import {
  clearDatabase,
  createUser,
  deleteFirebaseUsers,
  generateRandomValidUsername,
} from './utils/utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let firebaseApp: admin.app.App;
  let authHeader: Record<string, string>;
  let authService: AuthService;
  let usersService: UsersService;
  let ratingsService: RatingsService;
  let winesService: WinesService;
  let storesService: StoresService;
  let winemakersService: WinemakersService;
  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get(AuthService);
    ratingsService = app.get(RatingsService);
    winesService = app.get(WinesService);
    storesService = app.get(StoresService);
    winemakersService = app.get(WinemakersService);
    usersService = app.get(UsersService);

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

  describe(USERS_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_ENDPOINT;
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

    it(`should return ${HttpStatus.OK} and non empty page response`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedUserResponse>({
          data: [],
          meta: {
            page: 1,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 1,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedUserResponse,
        }),
      );
      expect(response.body.data).toHaveLength(1);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      // only create 9 because one user already exists
      for (let i = 0; i < 9; i++) {
        await createUser(app);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedUserResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedUserResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid user`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(USERS_ME_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_ME_ENDPOINT;
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

    it(`should return ${HttpStatus.OK} and currently logged in User`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(USERS_USERNAME_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_USERNAME_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and user`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }),
      );
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });
  });

  describe(USERS_USERNAME_FRIENDS_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_USERNAME_FRIENDS_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.OK} and empty page response`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedUserResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedUserResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        const friend: User = (await createUser(app)).user;
        await usersService.addFriend(friend, user);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedUserResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedUserResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK}ppp a valid user`, async () => {
      const friend: User = (await createUser(app)).user;
      await usersService.addFriend(friend, user);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedUserResponse({
          id: friend.id,
          username: friend.username,
          createdAt: friend.createdAt.toISOString(),
          updatedAt: friend.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(USERS_USERNAME_RATINGS_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_USERNAME_RATINGS_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          USERNAME_URL_PARAMETER,
          generateRandomValidUsername(),
        ),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.OK} and empty page response`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
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
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        await createTestRating(
          ratingsService,
          user,
          await createTestWine(
            winesService,
            await createTestWinemaker(winemakersService),
            await createTestStore(storesService),
          ),
        );
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedRatingResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedRatingResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid rating`, async () => {
      const rating = await createTestRating(
        ratingsService,
        user,
        await createTestWine(
          winesService,
          await createTestWinemaker(winemakersService),
          await createTestStore(storesService),
        ),
      );
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedRatingResponse({
          id: rating.id,
          stars: rating.stars,
          text: rating.text,
          createdAt: rating.createdAt.toISOString(),
          updatedAt: rating.updatedAt.toISOString(),
        }),
      );
    });
  });

  describe(USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT + ' (GET)', () => {
    const endpoint: string = USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} when the getting a friendship with users that do not exist`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.NOT_FOUND} when friend does not exist`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, user.username)
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.NOT_FOUND} when users are not friends`, async () => {
      const toBeDeletedUser: User = (await createUser(app)).user;

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, user.username)
          .replace(FRIEND_USERNAME_URL_PARAMETER, toBeDeletedUser.username),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.OK} when getting a present friendship`, async () => {
      const friend: User = (await createUser(app)).user;

      await usersService.addFriend(friend, user);

      const response: Response = await request(app.getHttpServer())
        [
          method
        ](USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(USERNAME_URL_PARAMETER, user.username).replace(FRIEND_USERNAME_URL_PARAMETER, friend.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  describe(USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT + ' (DELETE)', () => {
    const endpoint: string = USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT;
    const method: HttpMethod = 'delete';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} when the deleting user that does not exist`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, generateRandomValidUsername())
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user does not exist`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, user.username)
          .replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user exists but is not friends with user`, async () => {
      const toBeDeletedUser: User = (await createUser(app)).user;

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, user.username)
          .replace(FRIEND_USERNAME_URL_PARAMETER, toBeDeletedUser.username),
        exception: new NotFoundException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to delete another users friends`, async () => {
      const addingUser: User = (await createUser(app)).user;
      const toBeAddedUser: User = (await createUser(app)).user;

      await usersService.addFriend(addingUser, toBeAddedUser);

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint
          .replace(USERNAME_URL_PARAMETER, toBeAddedUser.username)
          .replace(FRIEND_USERNAME_URL_PARAMETER, addingUser.username),
        exception: new ForbiddenException(),
        message: 'You can not delete another users friend',
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.OK} when deleting a present friendship`, async () => {
      const friend: User = (await createUser(app)).user;

      await usersService.addFriend(friend, user);

      const response: Response = await request(app.getHttpServer())
        [
          method
        ](USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(USERNAME_URL_PARAMETER, user.username).replace(FRIEND_USERNAME_URL_PARAMETER, friend.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });
});
