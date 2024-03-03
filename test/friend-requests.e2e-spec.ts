import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { SendFriendRequestDto } from '../src/friend-requests/dtos/send-friend-request.dto';
import { FriendRequest } from '../src/friend-requests/entities/friend-request.entity';
import {
  FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT,
  FRIEND_REQUESTS_ID_DECLINE_ENDPOINT,
  FRIEND_REQUESTS_ID_REVOKE_ENDPOINT,
  FRIEND_REQUESTS_INCOMING_ENDPOINT,
  FRIEND_REQUESTS_OUTGOING_ENDPOINT,
  FRIEND_REQUESTS_SEND_ENDPOINT,
} from '../src/friend-requests/friend-requests.controller';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
import {
  PAGE_DEFAULT_VALUE,
  TAKE_DEFAULT_VALUE,
} from '../src/pagination/pagination-options.dto';
import { User } from '../src/users/entities/user.entity';
import { ID_URL_PARAMETER } from './../src/constants/url-parameter';
import {
  HttpMethod,
  complexExceptionThrownMessageArrayTest,
  complexExceptionThrownMessageStringTest,
  endpointExistTest,
  endpointProtectedTest,
  invalidUUIDTest,
} from './common/tests.common';
import {
  ExpectedFriendRequestResponse,
  buildExpectedFriendRequestResponse,
  buildExpectedPageResponse,
} from './utils/expect-builder';
import {
  clearDatabase,
  generateRandomValidUsername,
  login,
} from './utils/utils';

describe('FriendRequestsController (e2e)', () => {
  let app: INestApplication;
  let authHeader: Record<string, string>;
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
    const endpoint: string = FRIEND_REQUESTS_INCOMING_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and empty page response`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedFriendRequestResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedFriendRequestResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and page response with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        const sender: User = await authService.signUp(
          faker.internet.userName(),
          faker.internet.password(),
        );
        await friendRequestsService.send(sender, user);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedFriendRequestResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedFriendRequestResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid friend request`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        sender,
        user,
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedFriendRequestResponse({
          id: friendRequest.id,
          sender: {
            id: friendRequest.sender.id,
          },
          receiver: {
            id: friendRequest.receiver.id,
          },
          createdAt: friendRequest.createdAt.toISOString(),
        }),
      );
    });
  });

  describe(FRIEND_REQUESTS_OUTGOING_ENDPOINT + ' (GET)', () => {
    const endpoint: string = FRIEND_REQUESTS_OUTGOING_ENDPOINT;
    const method: HttpMethod = 'get';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).not.toBe(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.OK} and array with length of 1`, async () => {
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedFriendRequestResponse>({
          data: [],
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 0,
            pageCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedFriendRequestResponse,
        }),
      );
      expect(response.body.data).toHaveLength(0);
    });

    it(`should return ${HttpStatus.OK} and array with length of 10`, async () => {
      for (let i = 0; i < 10; i++) {
        const receiver: User = await authService.signUp(
          faker.internet.userName(),
          faker.internet.password(),
        );
        await friendRequestsService.send(user, receiver);
      }

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual(
        buildExpectedPageResponse<ExpectedFriendRequestResponse>({
          meta: {
            page: PAGE_DEFAULT_VALUE,
            take: TAKE_DEFAULT_VALUE,
            itemCount: 10,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
          buildExpectedResponse: buildExpectedFriendRequestResponse,
        }),
      );
      expect(response.body.data).toHaveLength(10);
    });

    it(`should return ${HttpStatus.OK} a valid friend requests`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        buildExpectedFriendRequestResponse({
          id: friendRequest.id,
          sender: {
            id: friendRequest.sender.id,
          },
          receiver: {
            id: friendRequest.receiver.id,
          },
          createdAt: friendRequest.createdAt.toISOString(),
        }),
      );
    });
  });

  describe(FRIEND_REQUESTS_SEND_ENDPOINT + ' (POST)', () => {
    const endpoint: string = FRIEND_REQUESTS_SEND_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint,
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} with authorization`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        exception: new BadRequestException(),
        header: authHeader,
      });
    });

    it(`should return ${HttpStatus.BAD_REQUEST} with invalid data`, async () => {
      await complexExceptionThrownMessageArrayTest({
        app,
        method,
        endpoint,
        body: {
          username: 123,
        },
        header: authHeader,
        exception: new BadRequestException(),
      });
    });

    it(`should return ${HttpStatus.NOT_FOUND} when sending a friend request to non existing user`, async () => {
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint,
        body: {
          username: generateRandomValidUsername(),
        },
        header: authHeader,
        exception: new NotFoundException(),
      });
    });

    it(`should return ${HttpStatus.CREATED} when sending friend request`, async () => {
      const receiver: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
      const data: SendFriendRequestDto = {
        username: receiver.username,
      };
      const response: Response = await request(app.getHttpServer())
        [method](endpoint)
        .send(data)
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it(`should return ${HttpStatus.CONFLICT} when already sent a friend request`, async () => {
      const receiver: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
      const data: SendFriendRequestDto = {
        username: receiver.username,
      };

      await friendRequestsService.send(user, receiver);

      await complexExceptionThrownMessageStringTest({
        app,
        endpoint,
        method,
        body: data,
        header: authHeader,
        exception: new ConflictException(),
      });
    });

    it(`should return ${HttpStatus.CONFLICT} when already received a friend request from sender and try to send one to him`, async () => {
      const sender: User = await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
      await friendRequestsService.send(sender, user);

      const data: SendFriendRequestDto = {
        username: sender.username,
      };

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint,
        body: data,
        header: authHeader,
        exception: new ConflictException(),
        message: 'The user already sent a friend request to you. Accept that.',
      });
    });
  });

  describe(FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT + ' (POST)', () => {
    const endpoint: string = FRIEND_REQUESTS_ID_ACCEPT_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () => {
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      });
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with random uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a valid uuid`, async () =>
      await invalidUUIDTest({
        app,
        method,
        endpoint,
        idParameter: ID_URL_PARAMETER,
        header: authHeader,
      }));

    it(`should return ${HttpStatus.OK} when accepting a received friend request`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        sender,
        user,
      );
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, friendRequest.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when accepting a friend request that you have sent to another user`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to accept another users friend request`, async () => {
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

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });
  });

  describe(FRIEND_REQUESTS_ID_DECLINE_ENDPOINT + ' (POST)', () => {
    const endpoint: string = FRIEND_REQUESTS_ID_DECLINE_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          ID_URL_PARAMETER,
          faker.string.alphanumeric(10),
        ),
        header: authHeader,
        exception: new BadRequestException(),
      }));

    it(`should return ${HttpStatus.OK} when declining a received friend request`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(sender, user);
      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, friendRequest.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when declining a friend request that you sent yourself`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to decline another users friend request`, async () => {
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

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });
  });

  describe(FRIEND_REQUESTS_ID_REVOKE_ENDPOINT + ' (POST)', () => {
    const endpoint: string = FRIEND_REQUESTS_ID_REVOKE_ENDPOINT;
    const method: HttpMethod = 'post';

    it('should exist', async () =>
      await endpointExistTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () =>
      await endpointProtectedTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with authorization`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.NOT_FOUND} with random uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, faker.string.uuid()),
        header: authHeader,
        exception: new NotFoundException(),
      }));

    it(`should return ${HttpStatus.BAD_REQUEST} if id parameter is not a uuid`, async () =>
      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(
          ID_URL_PARAMETER,
          faker.string.alphanumeric(10),
        ),
        header: authHeader,
        exception: new BadRequestException(),
      }));

    it(`should return ${HttpStatus.OK} when revoking a friend request that you sent yourself`, async () => {
      const receiver: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest: FriendRequest = await friendRequestsService.send(
        user,
        receiver,
      );

      const response: Response = await request(app.getHttpServer())
        [method](endpoint.replace(ID_URL_PARAMETER, friendRequest.id))
        .set(authHeader);

      expect(response.status).toBe(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.FORBIDDEN} when revoking a received friend request that wasn't sent by the user`, async () => {
      const sender: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.send(sender, user);

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });

    it(`should return ${HttpStatus.FORBIDDEN} when trying to revoking another users friend request`, async () => {
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

      await complexExceptionThrownMessageStringTest({
        app,
        method,
        endpoint: endpoint.replace(ID_URL_PARAMETER, friendRequest.id),
        header: authHeader,
        exception: new ForbiddenException(),
      });
    });
  });
});
