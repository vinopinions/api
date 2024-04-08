import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/users/entities/user.entity';

export const clearDatabase = async (app: INestApplication): Promise<void> => {
  const entityManager = app.get(EntityManager);
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
  user: User;
}> => {
  const authService = app.get(AuthService);

  const userData = {
    //username: generateRandomValidUsername(),
    username: generateRandomValidUsername(),
    password: faker.internet.password(),
  };

  const user: User = await authService.signUp(
    userData.username,
    userData.password,
  );

  return {
    authHeader: {
      Authorization: `Bearer test`,
    },
    user,
  };
};

export const generateRandomValidUsername = (): string => {
  return faker.internet.userName().toLocaleLowerCase().replace('-', '.');
};
