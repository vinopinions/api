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
import {
  clearDatabase,
  generateRandomValidUsername,
  isErrorResponse,
} from './utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get(AuthService);
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(AUTH_SIGNUP_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} with valid data`, () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CREATED);
    });

    it.each(['us_er', 'u1s2.3e4r', 'username', 'user35'])(
      `should return ${HttpStatus.CREATED} with valid usernames`,
      (username: string) => {
        const validData: SignUpDto = {
          username,
          password: faker.internet.password(),
        };
        return request(app.getHttpServer())
          .post(AUTH_SIGNUP_ENDPOINT)
          .send(validData)
          .expect(HttpStatus.CREATED);
      },
    );

    it.each([
      faker.string.alpha(2),
      faker.string.alpha(21),
      'us__er',
      'user_',
      '_user',
      '1user',
      'us..er',
      'user.',
      '.user',
    ])(
      `should return ${HttpStatus.BAD_REQUEST} with invalid usernames`,
      (username: string) => {
        const validData: SignUpDto = {
          username,
          password: faker.internet.password(),
        };
        return request(app.getHttpServer())
          .post(AUTH_SIGNUP_ENDPOINT)
          .send(validData)
          .expect(HttpStatus.BAD_REQUEST);
      },
    );

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, () => {
      const validData: SignUpDto = {
        username: faker.string.alphanumeric(2),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, () => {
      const validData: SignUpDto = {
        username: faker.string.alphanumeric(21),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, () => {
      const validData: SignUpDto = {
        username: '$$$$$$',
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, () => {
      const validData: SignUpDto = {
        username: faker.internet.userName().toUpperCase(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      await authService.signUp(validData.username, validData.password);

      return request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CONFLICT)
        .expect(isErrorResponse);
    });
  });

  describe(AUTH_LOGIN_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .expect(({ status }) => expect(status).not.toBe(HttpStatus.NOT_FOUND));
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} with valid data but no signup before`, () => {
      const validData: SignInDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, () => {
      const validData: SignInDto = {
        username: faker.string.alphanumeric(2),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, () => {
      const validData: SignInDto = {
        username: faker.string.alphanumeric(21),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, () => {
      const validData: SignInDto = {
        username: '$$$$$$',
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, () => {
      const validData: SignInDto = {
        username: faker.internet.userName().toUpperCase(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.CREATED} and access_token with valid data and signup before`, async () => {
      const validData: SignInDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };

      await authService.signUp(validData.username, validData.password);

      return request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CREATED)
        .expect((res) => expect(res.body).toHaveProperty('access_token'));
    });
  });
});
