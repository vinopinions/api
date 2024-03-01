import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_SIGNUP_ENDPOINT,
} from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SignInDto } from '../src/auth/dtos/sign-in.dto';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { AppModule } from './../src/app.module';
import {
  buildExpectedErrorResponseMessageArray,
  buildExpectedErrorResponseMessageString,
  buildExpectedUserResponse,
} from './utils/expect-builder';
import { clearDatabase, generateRandomValidUsername } from './utils/utils';

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
    it('should exist', async () => {
      const response: Response = await request(app.getHttpServer()).post(
        AUTH_SIGNUP_ENDPOINT,
      );

      expect(response.status).not.toBe(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and error response when no data was sent`, async () => {
      const response: Response = await request(app.getHttpServer()).post(
        AUTH_SIGNUP_ENDPOINT,
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: expect.any(Array<String>),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and error response when invalid data was sent`, async () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(invalidData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.CREATED} and user when valid data was sent`, async () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(
        buildExpectedUserResponse({ username: validData.username }),
      );
    });

    it.each(['us_er', 'u1s2.3e4r', 'username', 'user35'])(
      `should return ${HttpStatus.CREATED} with valid usernames`,
      async (username: string) => {
        const validData: SignUpDto = {
          username,
          password: faker.internet.password(),
        };
        const response: Response = await request(app.getHttpServer())
          .post(AUTH_SIGNUP_ENDPOINT)
          .send(validData);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
          buildExpectedUserResponse({ username: validData.username }),
        );
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
      async (username: string) => {
        const validData: SignUpDto = {
          username,
          password: faker.internet.password(),
        };
        const response: Response = await request(app.getHttpServer())
          .post(AUTH_SIGNUP_ENDPOINT)
          .send(validData);

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body).toEqual(
          buildExpectedErrorResponseMessageArray({
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
          }),
        );
      },
    );

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, async () => {
      const validData: SignUpDto = {
        username: faker.string.alphanumeric(2),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, async () => {
      const validData: SignUpDto = {
        username: faker.string.alphanumeric(21),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, async () => {
      const validData: SignUpDto = {
        username: '$$$$$$',
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, async () => {
      const validData: SignUpDto = {
        username: faker.internet.userName().toUpperCase(),
        password: faker.internet.password(),
      };

      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      await authService.signUp(validData.username, validData.password);

      const response: Response = await request(app.getHttpServer())
        .post(AUTH_SIGNUP_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageString({
          error: 'Conflict',
          message: 'This username is already taken',
          statusCode: HttpStatus.CONFLICT,
        }),
      );
    });
  });

  describe(AUTH_LOGIN_ENDPOINT + ' (POST)', () => {
    it('should exist', async () => {
      const response: Response = await request(app.getHttpServer()).post(
        AUTH_LOGIN_ENDPOINT,
      );

      expect(response.status).not.toBe(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, async () => {
      const response: Response = await request(app.getHttpServer()).post(
        AUTH_LOGIN_ENDPOINT,
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, async () => {
      const invalidData = {
        username: 123,
        password: false,
      };

      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(invalidData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} with valid data but no signup before`, async () => {
      const validData: SignInDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageString({
          error: 'Unauthorized',
          message: 'Invalid credentials',
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, async () => {
      const validData: SignInDto = {
        username: faker.string.alphanumeric(2),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, async () => {
      const validData: SignInDto = {
        username: faker.string.alphanumeric(21),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, async () => {
      const validData: SignInDto = {
        username: '$$$$$$',
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, async () => {
      const validData: SignInDto = {
        username: faker.internet.userName().toUpperCase(),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toEqual(
        buildExpectedErrorResponseMessageArray({
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it(`should return ${HttpStatus.CREATED} and access_token with valid data and signup before`, async () => {
      const validData: SignInDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };

      await authService.signUp(validData.username, validData.password);

      const response: Response = await request(app.getHttpServer())
        .post(AUTH_LOGIN_ENDPOINT)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('access_token');
    });
  });
});
