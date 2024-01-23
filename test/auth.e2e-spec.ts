import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SignInDto } from 'src/auth/dtos/sign-in.dto';
import { SignUpDto } from 'src/auth/dtos/sign-up.dto';
import request from 'supertest';
import { AppModule } from './../src/app.module';

const AUTH_ENDPOINT = '/auth';
const LOGIN_ENDPOINT = AUTH_ENDPOINT + '/login';
const SIGNUP_ENDPOINT = AUTH_ENDPOINT + '/signup';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(SIGNUP_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const validData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.CREATED} with valid data`, () => {
      const validData: SignUpDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      return request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CONFLICT} when using the same username twice`, async () => {
      const validData: SignUpDto = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      await request(app.getHttpServer()).post(SIGNUP_ENDPOINT).send(validData);

      return request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe(LOGIN_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with no data`, () => {
      return request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, () => {
      const invalidData = {
        username: 123,
        password: false,
      };
      return request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} with valid data but no signup before`, () => {
      const validData: SignInDto = {
        username: '123',
        password: 'false',
      };
      return request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(validData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
