import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { USERNAME_URL_PARAMETER } from '../src/constants/url-parameter';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
import { User } from '../src/users/entities/user.entity';
import {
  USERS_ENDPOINT,
  USERS_NAME_FRIENDS_ENDPOINT,
  USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT,
  USERS_USERNAME_ENDPOINT,
} from '../src/users/users.controller';
import { AppModule } from './../src/app.module';
import { clearDatabase, isErrorResponse, logResponse, login } from './utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
  let authService: AuthService;
  let friendRequestsService: FriendRequestsService;
  let user: User;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get(AuthService);
    friendRequestsService = app.get(FriendRequestsService);
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
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
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
          username: faker.internet.userName().toLowerCase(),
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

  describe(USERS_USERNAME_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
          ),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
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

    it(`should return ${HttpStatus.OK} and user with authorization`, async () => {
      console.log(user);
      return request(app.getHttpServer())
        .get(
          USERS_USERNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(logResponse)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(user.id);
          expect(body.username).toEqual(user.username);
          expect(body.createdAt).toEqual(user.createdAt.toISOString());
          expect(body.updatedAt).toEqual(user.updatedAt.toISOString());
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
            faker.internet.userName().toLowerCase(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });
  });

  describe(USERS_NAME_FRIENDS_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and empty array with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array of 3 users with authorization`, async () => {
      for (let i = 0; i < 3; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName().toLowerCase(),
          password: faker.internet.password(),
        };
        const createdUser: User = await authService.signUp(
          userData.username,
          userData.password,
        );
        const friendRequest = await friendRequestsService.send(
          createdUser,
          user,
        );
        await friendRequestsService.accept(friendRequest.id, user);
      }

      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(3);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.username).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });
  });

  describe(USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT + ' (DELETE)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
          ).replace(
            'FRIENDNAME_ENDPOINT_NAME',
            faker.internet.userName().toLowerCase(),
          ),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
          ).replace(
            'FRIENDNAME_ENDPOINT_NAME',
            faker.internet.userName().toLowerCase(),
          ),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when deleting user that does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            faker.internet.userName().toLowerCase(),
          ).replace(
            'FRIENDNAME_ENDPOINT_NAME',
            faker.internet.userName().toLowerCase(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace(
            'FRIENDNAME_ENDPOINT_NAME',
            faker.internet.userName().toLowerCase(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user exists but is not friends with user`, async () => {
      const toBeDeletedUser: User = await authService.signUp(
        faker.internet.userName().toLowerCase(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace('FRIENDNAME_ENDPOINT_NAME', toBeDeletedUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} when trying to delete another users friends`, async () => {
      const otherUser: User = await authService.signUp(
        faker.internet.userName().toLowerCase(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            otherUser.username,
          ).replace(
            'FRIENDNAME_ENDPOINT_NAME',
            faker.internet.userName().toLowerCase(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} when deleting a present friendship`, async () => {
      const createdUser: User = await authService.signUp(
        faker.internet.userName().toLowerCase(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(createdUser, user);
      await friendRequestsService.accept(friendRequest.id, user);

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            USERNAME_URL_PARAMETER,
            user.username,
          ).replace('FRIENDNAME_ENDPOINT_NAME', createdUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });
  });
});
