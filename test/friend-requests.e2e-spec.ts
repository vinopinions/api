import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { clearDatabase, isErrorResponse, login } from './utils';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { FRIEND_REQUESTS_SEND_ENDPOINT } from '../src/friend-requests/friend-requests.controller';
import request from 'supertest';
import { User } from '../src/users/entities/user.entity';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
import { SendFriendRequestDto } from '../src/friend-requests/dtos/send-friend-request.dto';
import { AuthService } from '../src/auth/auth.service';

describe('FriendRequestsController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let user: User;
  let friendRequestsService: FriendRequestsService;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const loginData = await login(app);
    friendRequestsService = app.get(FriendRequestsService);
    authService = app.get(AuthService);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(FRIEND_REQUESTS_SEND_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with authorization`, async () => {
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data and with authorization`, async () => {
      const invalidData = {
        to: 123,
      };
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .send(invalidData)
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when sending a friend request to non existing user with authorization`, async () => {
      const validData: SendFriendRequestDto = {
        to: faker.internet.userName(),
      };
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .send(validData)
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CREATED} when sending friend request with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const data = {
        to: receiver.username,
      };
      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .send(data)
        .set(authHeader)
        .expect(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CONFLICT} when already sent a friend request with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const data = {
        to: receiver.username,
      };

      await friendRequestsService.sendFriendRequest(user, receiver);

      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .send(data)
        .set(authHeader)
        .expect(HttpStatus.CONFLICT)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.CONFLICT} when already received a friend request from sender and try to send one to him with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      await friendRequestsService.sendFriendRequest(sender, user);

      const data = {
        to: sender.username,
      };

      return request(app.getHttpServer())
        .post(FRIEND_REQUESTS_SEND_ENDPOINT)
        .send(data)
        .set(authHeader)
        .expect(HttpStatus.CONFLICT)
        .expect(isErrorResponse);
    });
  });
});
