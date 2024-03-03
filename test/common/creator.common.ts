import { faker } from '@faker-js/faker';
import { AuthService } from '../../src/auth/auth.service';
import { STARS_MAX, STARS_MIN } from '../../src/ratings/entities/rating.entity';
import { RatingsService } from '../../src/ratings/ratings.service';
import { Store } from '../../src/stores/entities/store.entity';
import { StoresService } from '../../src/stores/stores.service';
import { User } from '../../src/users/entities/user.entity';
import { Winemaker } from '../../src/winemakers/entities/winemaker.entity';
import { WinemakersService } from '../../src/winemakers/winemakers.service';
import { Wine } from '../../src/wines/entities/wine.entity';
import { WinesService } from '../../src/wines/wines.service';
import { generateRandomValidUsername } from '../utils/utils';

export const createTestWinemaker = async (
  winemakersService: WinemakersService,
) => {
  return await winemakersService.create(faker.person.fullName());
};

export const createTestStore = async (storesService: StoresService) => {
  return await storesService.create(
    faker.company.name(),
    faker.location.streetAddress(),
    faker.internet.url(),
  );
};

export const createTestWine = async (
  winesService: WinesService,
  winemaker: Winemaker,
  store: Store,
) => {
  return await winesService.create(
    faker.word.noun(),
    faker.date.past().getFullYear(),
    winemaker.id,
    [store.id],
    faker.word.noun(),
    faker.location.country(),
  );
};

export const createTestRating = async (
  ratingsService: RatingsService,
  user: User,
  wine: Wine,
) => {
  return await ratingsService.create(
    faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
    faker.lorem.lines(),
    user,
    wine,
  );
};

export const createTestUser = async (authService: AuthService) => {
  return await authService.signUp(
    generateRandomValidUsername(),
    faker.internet.password(),
  );
};
