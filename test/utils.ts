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
  userData: {
    username: string;
    password: string;
  };
}> => {
  const authService = app.get<AuthService>(AuthService);

  const userData = {
    username: faker.internet.userName(),
    password: faker.internet.password(),
  };

  await authService.signUp(userData.username, userData.password);

  const { access_token } = await authService.signIn(
    userData.username,
    userData.password,
  );
  return {
    authHeader: {
      Authorization: `Bearer ${access_token}`,
    },
    userData,
  };
};
