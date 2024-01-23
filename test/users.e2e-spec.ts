import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_SIGNUP_ENDPOINT,
} from '../src/auth/auth.controller';
import { USERS_ENDPOINT } from '../src/users/users.controller';
import { AppModule } from './../src/app.module';
import { clearDatabase } from './utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const accountData = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };

    const signUpResponse = await request(app.getHttpServer())
      .post(AUTH_SIGNUP_ENDPOINT)
      .send(accountData);
    if (!(signUpResponse.status == HttpStatus.CREATED)) return;

    const logInResponse = await request(app.getHttpServer())
      .post(AUTH_LOGIN_ENDPOINT)
      .send(accountData);
    if (!(logInResponse.status == HttpStatus.CREATED)) return;
    authHeader = {
      Authorization: `Bearer ${logInResponse.body.access_token}`,
    };
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
  });
});
