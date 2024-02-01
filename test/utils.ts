import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Response } from 'supertest';
import { EntityManager } from 'typeorm';
import { AuthService } from '../src/auth/auth.service';
import { StoresService } from '../src/stores/stores.service';
import { User } from '../src/users/entities/user.entity';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { WinesService } from '../src/wines/wines.service';

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
    username: faker.internet.userName(),
    password: faker.internet.password(),
  };

  const user: User = await authService.signUp(
    userData.username,
    userData.password,
  );

  const { access_token } = await authService.signIn(
    userData.username,
    userData.password,
  );
  return {
    authHeader: {
      Authorization: `Bearer ${access_token}`,
    },
    user,
  };
};

export const setupWineRatingTest = async (app: INestApplication) => {
  const winemakersService = app.get(WinemakersService);
  const storesService = app.get(StoresService);
  const winesService = app.get(WinesService);

  const winemakerId = (await winemakersService.create('Winemaker')).id;

  const storeName = faker.company.name();
  const storeId = (await storesService.create(storeName)).id;

  const createdWine = await winesService.create(
    faker.word.noun(),
    faker.date.past().getFullYear(),
    faker.string.uuid(),
    [faker.string.uuid()],
    faker.word.noun(),
    faker.location.country(),
  );
  return { createdWine, storeId, winemakerId };
};

export const isErrorResponse = (res: Response, messageContains?: string) => {
  expect(res.body).toHaveProperty('message');
  if (messageContains) expect(res.body!.message).toContain(messageContains);

  expect(res.body).toHaveProperty('statusCode');
};

/**
 * .expect(logResponse)
 */
export const logResponse = (res: Response) => {
  console.log(JSON.stringify(res.body, null, 2));
};
