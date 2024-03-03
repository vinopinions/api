import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
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
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
} from './common/tests.common';
import { buildExpectedUserResponse } from './utils/expect-builder';
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
    const endpoint: string = AUTH_SIGNUP_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} and error response when no data was sent`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and error response when invalid data was sent`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: 123,
          password: false,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.CREATED} and user when valid data was sent`, async () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          username: validData.username,
          friends: [],
          ratings: [],
        }),
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
          [method](endpoint)
          .send(validData);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
          buildExpectedUserResponse({
            username: validData.username,
            friends: [],
            ratings: [],
          }),
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
        await complexExceptionThrownMessageArrayTest({
          app,
          method,
          endpoint,
          body: {
            username,
            password: faker.internet.password(),
          },
          exception: new BadRequestException(),
        });
      },
    );

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(2),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(21),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: '$$$$$$',
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: generateRandomValidUsername().toUpperCase(),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };
      await authService.signUp(validData.username, validData.password);

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint,
        body: {
          username: validData.username,
          password: faker.internet.password(),
        },
        exception: new ConflictException(),
        message: 'This username is already taken',
      });
    });
  });

  describe(AUTH_LOGIN_ENDPOINT + ' (POST)', () => {
    const endpoint: string = AUTH_LOGIN_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: 123,
          password: false,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} with valid data but no signup before`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint,
        body: {
          username: generateRandomValidUsername(),
          password: faker.internet.password(),
        },
        exception: new UnauthorizedException(),
        message: 'Invalid credentials',
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(2),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(21),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: '$$$$$$',
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: generateRandomValidUsername().toUpperCase(),
          password: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.CREATED} and access_token with valid data and signup before`, async () => {
      const validData: SignInDto = {
        username: generateRandomValidUsername(),
        password: faker.internet.password(),
      };

      await authService.signUp(validData.username, validData.password);

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('access_token');
    });
  });
});
