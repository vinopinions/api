import { faker } from '@faker-js/faker';
import {
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import {
  FRIEND_USERNAME_URL_PARAMETER,
  USERNAME_URL_PARAMETER,
} from '../src/constants/url-parameter';
import {
  Rating,
  STARS_MAX,
  STARS_MIN,
} from '../src/ratings/entities/rating.entity';
import { RatingsService } from '../src/ratings/ratings.service';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import {
  USERS_ENDPOINT,
  USERS_ME_ENDPOINT,
  USERS_USERNAME_ENDPOINT,
  USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT,
} from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { WinesService } from '../src/wines/wines.service';
import { AppModule } from './../src/app.module';
import {
  HttpMethod,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
} from './common/tests.common';
import { buildExpectedUserResponse } from './utils/expect-builder';
import {
  clearDatabase,
  generateRandomValidUsername,
  login,
} from './utils/utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let authService: AuthService;
  let usersService: UsersService;
  let ratingsService: RatingsService;
  let winesService: WinesService;
  let storesService: StoresService;
  let winemakersService: WinemakersService;
  let user: User;

  beforeEach(async () => {
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
    const loginData = await login(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
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

    it(`should return ${HttpStatus.OK} and array with length of 1`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      // create 9 users since one is already created while login
      for (let i = 0; i < 9; i++) {
        const userData: SignUpDto = {
          username: generateRandomValidUsername(),
          password: faker.internet.password(),
        };
        await authService.signUp(userData.username, userData.password);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} and a user with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          friends: [],
          ratings: [],
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

    it(`should return ${HttpStatus.OK} and currently logged in User including ratings and friends`, async () => {
      const ratings: Rating[] = [];
      for (let i = 0; i < 3; i++) {
        ratings.push(await createRating());
      }
      // get updated user so relations wont be overridden
      user = await usersService.findOne({
        where: {
          id: user.id,
        },
      });
      const friends: User[] = [];
      for (let i = 0; i < 3; i++) {
        const createdUser: User = await authService.signUp(
          generateRandomValidUsername(),
          faker.internet.password(),
        );
        await usersService.addFriend(createdUser, user);
        friends.push(createdUser);
      }
      user = await usersService.findOne({
        where: {
          id: user.id,
        },
      });

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          friends: user.friends.map((friend) => {
            return {
              id: friend.id,
            };
          }),
          ratings: ratings.map((rating) => {
            return {
              id: rating.id,
            };
          }),
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

    it(`should return ${HttpStatus.OK} and user including friends and ratings with authorization`, async () => {
      const ratings: Rating[] = [];
      for (let i = 0; i < 3; i++) {
        ratings.push(await createRating());
      }
      // get updated user so relations wont be overridden
      user = await usersService.findOne({
        where: {
          id: user.id,
        },
      });
      const friends: User[] = [];
      for (let i = 0; i < 3; i++) {
        const createdUser: User = await authService.signUp(
          generateRandomValidUsername(),
          faker.internet.password(),
        );
        await usersService.addFriend(createdUser, user);
        friends.push(createdUser);
      }
      user = await usersService.findOne({
        where: {
          id: user.id,
        },
      });

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(USERNAME_URL_PARAMETER, user.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          id: user.id,
          username: user.username,
          friends: user.friends.map((friend) => {
            return {
              id: friend.id,
            };
          }),
          ratings: ratings.map((rating) => {
            return {
              id: rating.id,
            };
          }),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }),
      );
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
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
      const toBeDeletedUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );

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
      const addingUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
      const toBeAddedUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );

      usersService.addFriend(addingUser, toBeAddedUser);

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
      const friend: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );

      usersService.addFriend(friend, user);

      const response: Response = await request(app.getHttpServer())
        [
          method
        ](USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(USERNAME_URL_PARAMETER, user.username).replace(FRIEND_USERNAME_URL_PARAMETER, friend.username))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });
  });

  const createRating = async (): Promise<Rating> => {
    const winemaker = await winemakersService.create(faker.person.fullName());
    const store = await storesService.create(faker.company.name());
    const wine = await winesService.create(
      faker.word.noun(),
      faker.date.past().getFullYear(),
      winemaker.id,
      [store.id],
      faker.word.noun(),
      faker.location.country(),
    );
    return ratingsService.create(
      faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
      faker.lorem.text(),
      user,
      wine,
    );
  };
});
