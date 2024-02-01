import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Response } from 'supertest';
import { EntityManager } from 'typeorm';
import { AuthService } from '../src/auth/auth.service';
import { CreateStoreDto } from '../src/stores/dtos/create-store.dto';
import { WinemakersService } from '../src/winemakers/winemakers.service';
import { StoresService } from '../src/stores/stores.service';
import { CreateWineDto } from '../src/wines/dtos/create-wine.dto';
import { WinesService } from '../src/wines/wines.service';
import { User } from '../src/users/entities/user.entity';
import { RatingsService } from '../src/ratings/ratings.service';
import { User } from '../src/users/entities/user.entity';

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

export const isErrorResponse = (res: Response, messageContains?: string) => {
  expect(res.body).toHaveProperty('message');
  if (messageContains) expect(res.body!.message).toContain(messageContains);

  expect(res.body).toHaveProperty('statusCode');
};

export const setupWineRatingTest = async (app: INestApplication) => {
  const winemakersService = app.get(WinemakersService);
  const storesService = app.get(StoresService);
  const winesService = app.get(WinesService);

  const winemakerId = (await winemakersService.create('Winemaker')).id;

  const store: CreateStoreDto = {
    name: 'Store',
  };
  const storeId = (await storesService.create(store)).id;

  const wine: CreateWineDto = {
    name: 'Wine',
    grapeVariety: 'Grape',
    heritage: 'Region',
    year: 2020,
    storeIds: [storeId],
    winemakerId: winemakerId,
  };
  const createdWine = await winesService.create(wine);
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
