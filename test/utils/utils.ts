import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import admin from 'firebase-admin';
import * as firebaseAuth from 'firebase/auth';
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

export const deleteFirebaseUsers = async (
  app: admin.app.App,
): Promise<void> => {
  const listUsersResult = await app.auth().listUsers();
  try {
    listUsersResult.users.forEach(async (userRecord) => {
      await app.auth().deleteUser(userRecord.uid);
    });
  } catch (error) {
    console.error('Failed deleting firebase users. Error: ' + error);
  }
};

export const createUser = async (
  app: INestApplication,
): Promise<{
  authHeader: {
    Authorization: string;
  };
  user: User;
}> => {
  const authService = app.get(AuthService);

  const { firebaseUser, userData } = await createFirebaseUser();
  const token = await firebaseUser.getIdToken();
  const user: User = await authService.signUp(userData.username, token);

  return {
    authHeader: {
      Authorization: `Bearer ${token}`,
    },
    user,
  };
};

export const createFirebaseUser = async (): Promise<{
  firebaseUser: firebaseAuth.User;
  userData: { username: string; email: string; password: string };
}> => {
  const userData = {
    username: generateRandomValidUsername(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };

  await admin.auth().createUser({
    email: userData.email,
    password: userData.password,
  });

  const credential: firebaseAuth.UserCredential =
    await firebaseAuth.signInWithEmailAndPassword(
      firebaseAuth.getAuth(),
      userData.email,
      userData.password,
    );

  return { firebaseUser: credential.user, userData };
};

export const generateRandomValidUsername = (): string => {
  return faker.internet.userName().toLocaleLowerCase().replace('-', '.');
};
