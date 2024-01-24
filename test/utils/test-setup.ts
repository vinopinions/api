import { INestApplication } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { clearDatabase, login } from '../utils';

export interface TestSetupData {
  app: INestApplication;
  authHeader: object;
  authService: AuthService;
  userData: { username: string; password: string };
}

export async function setupTest(): Promise<TestSetupData> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  await app.init();
  const authService = app.get<AuthService>(AuthService);
  const loginData = await login(app);

  return {
    app,
    authHeader: loginData.authHeader,
    authService,
    userData: loginData.userData,
  };
}

export async function tearDownTest(app: INestApplication): Promise<void> {
  await clearDatabase(app);
  await app.close();
}
