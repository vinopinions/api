import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_SIGNUP_ENDPOINT,
} from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SignInDto } from '../src/auth/dtos/sign-in.dto';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { AppModule } from './../src/app.module';
import { clearDatabase } from './utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(AUTH_SIGNUP_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.CREATED} with valid data`, () => {
      const validData: SignUpDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const validData: SignUpDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      await authService.signUp(validData.username, validData.password);

      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe(AUTH_LOGIN_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} with valid data but no signup before`, () => {
      const validData: SignInDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.CREATED} and access_token with valid data and signup before`, async () => {
      const validData: SignInDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };

      await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CREATED)
        .expect((res) => expect(res.body).toHaveProperty('access_token'));
    });
  });
});
