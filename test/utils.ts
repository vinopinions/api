import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  AUTH_LOGIN_ENDPOINT,
  AUTH_SIGNUP_ENDPOINT,
} from 'src/auth/auth.controller';
import request from 'supertest';
import { EntityManager } from 'typeorm';

export const clearDatabase = async (app: INestApplication): Promise<void> => {
  const entityManager = app.get<EntityManager>(EntityManager);
  const tableNames = entityManager.connection.entityMetadatas
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');
  await entityManager.query(`truncate ${tableNames} restart identity cascade;`);
};

export const login = async (
  app: INestApplication,
): Promise<{
  authHeader: {
    Authorization: string;
  };
  accountData: {
    username: string;
    password: string;
  };
}> => {
  const accountData = {
    username: faker.internet.userName(),
    password: faker.internet.password(),
  };

  const signUpResponse = await request(app.getHttpServer())
    .post(AUTH_SIGNUP_ENDPOINT)
    .send(accountData);
  if (!(signUpResponse.status == HttpStatus.CREATED))
    throw Error(`Signup request returned ${signUpResponse.status}`);

  const logInResponse = await request(app.getHttpServer())
    .post(AUTH_LOGIN_ENDPOINT)
    .send(accountData);
  if (!(logInResponse.status == HttpStatus.CREATED))
    throw Error(`Login request returned ${logInResponse.status}`);
  return {
    authHeader: {
      Authorization: `Bearer ${logInResponse.body.access_token}`,
    },
    accountData,
  };
};
