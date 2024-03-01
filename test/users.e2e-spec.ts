import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import {
  FRIEND_USERNAME_URL_PARAMETER,
  USERNAME_URL_PARAMETER,
} from '../src/constants/url-parameter';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
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
  clearDatabase,
  generateRandomValidUsername,
  isErrorResponse,
  login,
} from './utils/utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let authService: AuthService;
  let usersService: UsersService;
  let friendRequestsService: FriendRequestsService;
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
    friendRequestsService = app.get(FriendRequestsService);
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
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and array with length of 1 with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(1);
        });
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

      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} and a user with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.username).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it(`should return ${HttpStatus.OK} and a user with no passwordHash with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.passwordHash).toBeUndefined();
        });
    });
  });

  describe(USERS_ME_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_ME_ENDPOINT)
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ME_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ME_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and currently logged in User including ratings and friends, excluding passwordHash with authorization`, async () => {
      const ratings: Rating[] = [];
      for (let i = 0; i < 3; i++) {
        ratings.push(await createRating());
      }
      const friends: User[] = [];
      for (let i = 0; i < 3; i++) {
        const createdUser: User = await authService.signUp(
          generateRandomValidUsername(),
          faker.internet.password(),
        );
        await usersService.addFriend(createdUser, user);
        friends.push(createdUser);
      }
      user.friends = friends;
      user.ratings = ratings;

      return request(app.getHttpServer())
        .get(USERS_ME_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(user.id);
          expect(body.username).toEqual(user.username);
          expect(body.createdAt).toEqual(user.createdAt.toISOString());
          expect(body.updatedAt).toEqual(user.updatedAt.toISOString());
          (body.friends as Array<any>).forEach((friend) => {
            expect(friend.id).toBeDefined();
            const realFriend: User | undefined = friends.find(
              (i) => i.id == friend.id,
            );
            expect(realFriend).toBeDefined();
            // we just return here since the test would have failed already anyways
            if (realFriend == undefined) return;
            expect(friend.id).toEqual(realFriend.id);
            expect(friend.username).toEqual(realFriend.username);
            expect(friend.createdAt).toEqual(
              realFriend.createdAt.toISOString(),
            );
            expect(friend.updatedAt).toEqual(
              realFriend.updatedAt.toISOString(),
            );
          });
          (body.ratings as Array<any>).forEach((rating, index) => {
            expect(rating.id).toBeDefined();
            const realRating: Rating | undefined = ratings.find(
              (i) => i.id == rating.id,
            );
            expect(realRating).toBeDefined();
            // we just return here since the test would have failed already anyways
            if (realRating == undefined) return;
            expect(rating.id).toEqual(realRating.id);
            expect(rating.stars).toEqual(realRating.stars);
            expect(rating.text).toEqual(realRating.text);
            expect(rating.createdAt).toEqual(
              realRating.createdAt.toISOString(),
            );
            expect(rating.updatedAt).toEqual(
              realRating.updatedAt.toISOString(),
            );
          });
        });
    });
  });

  describe(USERS_USERNAME_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and user including friends and ratings with authorization`, async () => {
      const ratings: Rating[] = [];
      for (let i = 0; i < 3; i++) {
        ratings.push(await createRating());
      }
      const friends: User[] = [];
      for (let i = 0; i < 3; i++) {
        const createdUser: User = await authService.signUp(
          generateRandomValidUsername(),
          faker.internet.password(),
        );
        await usersService.addFriend(createdUser, user);
        friends.push(createdUser);
      }
      user.friends = friends;
      user.ratings = ratings;
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(user.id);
          expect(body.username).toEqual(user.username);
          expect(body.createdAt).toEqual(user.createdAt.toISOString());
          expect(body.updatedAt).toEqual(user.updatedAt.toISOString());
          (body.friends as Array<any>).forEach((friend, index) => {
            expect(friend.id).toBeDefined();
            const realFriend: User | undefined = friends.find(
              (i) => i.id == friend.id,
            );
            expect(realFriend).toBeDefined();
            // we just return here since the test would have failed already anyways
            if (realFriend == undefined) return;
            expect(friend.id).toEqual(realFriend.id);
            expect(friend.username).toEqual(realFriend.username);
            expect(friend.createdAt).toEqual(
              realFriend.createdAt.toISOString(),
            );
            expect(friend.updatedAt).toEqual(
              realFriend.updatedAt.toISOString(),
            );
          });
          (body.ratings as Array<any>).forEach((rating, index) => {
            expect(rating.id).toBeDefined();
            const realRating: Rating | undefined = ratings.find(
              (i) => i.id == rating.id,
            );
            expect(realRating).toBeDefined();
            // we just return here since the test would have failed already anyways
            if (realRating == undefined) return;
            expect(rating.id).toEqual(realRating.id);
            expect(rating.stars).toEqual(realRating.stars);
            expect(rating.text).toEqual(realRating.text);
            expect(rating.createdAt).toEqual(
              realRating.createdAt.toISOString(),
            );
            expect(rating.updatedAt).toEqual(
              realRating.updatedAt.toISOString(),
            );
          });
        });
    });

    it(`should return ${HttpStatus.OK} and no passwordHash with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.passwordHash).toBeUndefined();
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });
  });

  describe(USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT + ' (DELETE)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ).replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ).replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when deleting user that does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ).replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user exists but is not friends with user`, async () => {
      const toBeDeletedUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace(FRIEND_USERNAME_URL_PARAMETER, toBeDeletedUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} when trying to delete another users friends`, async () => {
      const otherUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            otherUser.username,
          ).replace(
            FRIEND_USERNAME_URL_PARAMETER,
            generateRandomValidUsername(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} when deleting a present friendship`, async () => {
      const createdUser: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(createdUser, user);
      await friendRequestsService.accept(friendRequest.id, user);

      return request(app.getHttpServer())
        .delete(
          USERS_USERNAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace(FRIEND_USERNAME_URL_PARAMETER, createdUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
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
