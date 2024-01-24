import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import {
  USERS_ENDPOINT,
  USERS_NAME_ENDPOINT,
  USERS_NAME_FRIENDS_ENDPOINT,
} from '../src/users/users.controller';
import { AppModule } from './../src/app.module';
import { clearDatabase, login } from './utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let authService: AuthService;
  let userData: { username: string; password: string };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get<AuthService>(AuthService);
    const loginData = await login(app);
    authHeader = loginData.authHeader;
    userData = loginData.userData;
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
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
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and  array with length of one with authorization`, async () => {
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
          username: faker.internet.userName(),
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

    it(`should return ${HttpStatus.OK} and 10 valid user with authorization`, async () => {
      // create 9 users since one is already created while login
      for (let i = 0; i < 9; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        };
        await authService.signUp(userData.username, userData.password);
      }

      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(10);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.username).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it(`should return ${HttpStatus.OK} and no passwordHash with authorization`, async () => {
      // create 9 users since one is already created while login
      for (let i = 0; i < 9; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        };
        await authService.signUp(userData.username, userData.password);
      }

      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(10);
          (body as Array<any>).forEach((item) => {
            expect(item.passwordHash).toBeUndefined();
          });
        });
    });
  });

  describe(USERS_NAME_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', userData.username))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and user with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', userData.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.username).toEqual(userData.username);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
        });
    });

    it(`should return ${HttpStatus.OK} and not passwordHash with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', userData.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.passwordHash).toBeUndefined();
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', faker.internet.userName()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
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
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT.replace(':name', userData.username))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and empty array with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT.replace(':name', userData.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            ':name',
            faker.internet.userName(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
