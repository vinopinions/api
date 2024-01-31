import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { clearDatabase, isErrorResponse, login } from './utils';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT,
  FRIEND_REQUESTS_ID_DECLINE_ENDPOINT,
  FRIEND_REQUESTS_INCOMING_ENDPOINT,
  FRIEND_REQUESTS_OUTGOING_ENDPOINT,
  FRIEND_REQUESTS_SEND_ENDPOINT,
} from '../src/friend-requests/friend-requests.controller';
import request from 'supertest';
import { User } from '../src/users/entities/user.entity';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
import { SendFriendRequestDto } from '../src/friend-requests/dtos/send-friend-request.dto';
import { AuthService } from '../src/auth/auth.service';
import { FriendRequest } from '../src/friend-requests/entities/friend-request.entity';

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

  describe(FRIEND_REQUESTS_INCOMING_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and array with length of 1 with authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        const sender: User = await authService.signUp(
          faker.internet.userName(),
          faker.internet.password(),
        );
        await friendRequestsService.send(sender, user);
      }

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} a valid friend requests with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        sender,
        user,
      );

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toEqual(friendRequest.id);
            expect(item.sender.id).toEqual(friendRequest.sender.id);
            expect(item.receiver.id).toEqual(friendRequest.receiver.id);
            expect(item.createdAt).toEqual(
              friendRequest.createdAt.toISOString(),
            );
          });
        });
    });

    it(`should return ${HttpStatus.OK} a valid friend requests that does not contain passwordHash for sender/receiver with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      await friendRequestsService.send(sender, user);

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_INCOMING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.sender.passwordHash).toBeUndefined();
            expect(item.receiver.passwordHash).toBeUndefined();
          });
        });
    });
  });

  describe(FRIEND_REQUESTS_OUTGOING_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and array with length of 1 with authorization`, async () => {
      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      for (let i = 0; i < 10; i++) {
        const receiver: User = await authService.signUp(
          faker.internet.userName(),
          faker.internet.password(),
        );
        await friendRequestsService.send(user, receiver);
      }

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} a valid friend requests with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toEqual(friendRequest.id);
            expect(item.sender.id).toEqual(friendRequest.sender.id);
            expect(item.receiver.id).toEqual(friendRequest.receiver.id);
            expect(item.createdAt).toEqual(
              friendRequest.createdAt.toISOString(),
            );
          });
        });
    });

    it(`should return ${HttpStatus.OK} a valid friend requests that does not contain passwordHash for sender/receiver with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      await friendRequestsService.send(user, receiver);

      return request(app.getHttpServer())
        .get(FRIEND_REQUESTS_OUTGOING_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(1);
          (body as Array<any>).forEach((item) => {
            expect(item.sender.passwordHash).toBeUndefined();
            expect(item.receiver.passwordHash).toBeUndefined();
          });
        });
    });
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

      await friendRequestsService.send(user, receiver);

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
      await friendRequestsService.send(sender, user);

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

  describe(FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random uuid authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(
            ':id',
            faker.string.alphanumeric(10),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} when accepting a received friend request with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(sender, user);
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when accepting a friend request that you sent yourself with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.FORBIDDEN)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to accept another users friend request with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        sender,
        receiver,
      );

      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.FORBIDDEN)
        .expect(isErrorResponse);
    });
  });

  describe(FRIEND_REQUESTS_ID_DECLINE_ENDPOINT + ' (POST)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .expect(HttpStatus.UNAUTHORIZED)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random uuid authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(
            ':id',
            faker.string.uuid(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.BAD_REQUEST} and a response containing "uuid" if id parameter is not a uuid with authorization`, async () => {
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(
            ':id',
            faker.string.alphanumeric(10),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => isErrorResponse(res, 'uuid'));
    });

    it(`should return ${HttpStatus.OK} when declining a received friend request with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(sender, user);
      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when declining a friend request that you sent yourself with authorization`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.FORBIDDEN)
        .expect(isErrorResponse);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to decline another users friend request with authorization`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        sender,
        receiver,
      );

      return request(app.getHttpServer())
        .post(
          FRIEND_REQUESTS_ID_DECLINE_ENDPOINT.replace(':id', friendRequest.id),
        )
        .set(authHeader)
        .expect(HttpStatus.FORBIDDEN)
        .expect(isErrorResponse);
    });
  });
});
