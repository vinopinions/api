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

export const isErrorResponse = (res: Response, messageContains?: string) => {
  expect(res.body).toHaveProperty('message');
  if (messageContains) expect(res.body!.message).toContain(messageContains);

  expect(res.body).toHaveProperty('statusCode');
};

export const setupWineRatingTest = async (app: INestApplication) => {
  const winemakersService = app.get<WinemakersService>(WinemakersService);
  const storesService = app.get<StoresService>(StoresService);
  const winesService = app.get<WinesService>(WinesService);

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
  const wineId = (await winesService.create(wine)).id;
  return { wineId, storeId, winemakerId };
};
