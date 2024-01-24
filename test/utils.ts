import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuthService } from '../src/auth/auth.service';

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
  const authService = app.get<AuthService>(AuthService);

  const accountData = {
    username: faker.internet.userName(),
    password: faker.internet.password(),
  };

  await authService.signUp(accountData.username, accountData.password);

  const { access_token } = await authService.signIn(
    accountData.username,
    accountData.password,
  );
  return {
    authHeader: {
      Authorization: `Bearer ${access_token}`,
    },
    accountData,
  };
};
