import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import admin from 'firebase-admin';
import { initializeApp as initializeFirebaseClient } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import request, { Response } from 'supertest';
import { AUTH_SIGNUP_ENDPOINT } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { AppModule } from './../src/app.module';
import {
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
} from './common/tests.common';
import { buildExpectedUserResponse } from './utils/expect-builder';
import {
  clearDatabase,
  createFirebaseUser,
  deleteFirebaseUsers,
  generateRandomValidUsername,
} from './utils/utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let firebaseApp: admin.app.App;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    authService = app.get(AuthService);

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

  afterEach(async () => {
    await clearDatabase(app);
    await deleteFirebaseUsers(firebaseApp);
  });

  afterAll(async () => {
    await firebaseApp.delete();
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
          firebaseToken: false,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and error response when invalid firebaseToken was sent`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: 123,
          firebaseToken: faker.internet.password(),
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.CREATED} and user when valid data was sent`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        firebaseToken,
      };

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(validData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual(
        buildExpectedUserResponse({
          username: validData.username,
        }),
      );
    });

    it.each(['us_er', 'u1s2.3e4r', 'username', 'user35'])(
      `should return ${HttpStatus.CREATED} with valid usernames`,
      async (username: string) => {
        const firebaseToken = await (await createFirebaseUser()).getIdToken();

        const validData: SignUpDto = {
          username,
          firebaseToken,
        };
        const response: Response = await request(app.getHttpServer())
          [method](endpoint)
          .send(validData);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
          buildExpectedUserResponse({
            username: validData.username,
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
        const firebaseToken = await (await createFirebaseUser()).getIdToken();

        await complexExceptionThrownMessageArrayTest({
          app,
          method,
          endpoint,
          body: {
            username,
            firebaseToken,
          },
          exception: new BadRequestException(),
        });
      },
    );

    it(`should return ${HttpStatus.BAD_REQUEST} with too short username`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(2),
          firebaseToken,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with too long username`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: faker.string.alphanumeric(21),
          firebaseToken,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with forbidden characters`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: '$$$$$$',
          firebaseToken,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with uppercase characters`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: generateRandomValidUsername().toUpperCase(),
          firebaseToken,
        },
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const firebaseToken = await (await createFirebaseUser()).getIdToken();

      const validData: SignUpDto = {
        username: generateRandomValidUsername(),
        firebaseToken,
      };
      await authService.signUp(validData.username, validData.firebaseToken);

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint,
        body: {
          username: validData.username,
          firebaseToken,
        },
        exception: new ConflictException(),
        message: 'This username is already taken',
      });
    });
  });
});
