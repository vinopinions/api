import { faker } from '@faker-js/faker';
import { INestApplication, Injectable } from '@nestjs/common';
import {
  clearDatabase,
  generateRandomValidUsername,
} from '../../test/utils/utils';
import { AuthService } from '../auth/auth.service';
import { STARS_MAX, STARS_MIN } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { S3Service } from '../s3/s3.service';
import { Store } from '../stores/entities/store.entity';
import { StoresService } from '../stores/stores.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Winemaker } from '../winemakers/entities/winemaker.entity';
import { WinemakersService } from '../winemakers/winemakers.service';
import { Wine } from '../wines/entities/wine.entity';
import { WinesService } from '../wines/wines.service';
import {
  generateRandomUniqueNumbers,
  getImageBufferFromUrl,
  groupArray,
  randomizeArray,
} from './utils';

@Injectable()
export class DummyDataService {
  async generateAndInsertDummyData(app: INestApplication) {
    const authService: AuthService = app.get(AuthService);
    const usersService: UsersService = app.get(UsersService);
    const winemakersService: WinemakersService = app.get(WinemakersService);
    const storesService: StoresService = app.get(StoresService);
    const winesService: WinesService = app.get(WinesService);
    const ratingsService: RatingsService = app.get(RatingsService);
    const s3Service: S3Service = app.get(S3Service);

    // clear database
    await clearDatabase(app);

    // clear s3
    await s3Service.clearBucket();

    // create 100 users + 'oskar' and 'tschokri'
    await this.generateAndInsertUsers(100, authService);
    let users: User[] = await usersService.findMany();

    // create 20 winemakers
    await this.generateAndInsertWinemakers(20, winemakersService);
    const winemakers: Winemaker[] = await winemakersService.findMany();

    // create 40 stores
    await this.generateAndInsertStores(40, storesService);
    const stores: Store[] = await storesService.findMany();

    // create 100 wines
    await this.generateAndInsertWines(100, winemakers, stores, winesService);
    const wines: Wine[] = await winesService.findMany();

    // create 10 ratings per user
    await this.generateAndInsertRatings(10, users, wines, ratingsService);
    // refresh users because if you modify another relation the previous one seems to be overriden
    users = await usersService.findMany();

    // assign 10 friends to each user
    await this.generateAndInsertFriendships(10, users, usersService);
  }

  private generateAndInsertUsers = async (
    amount: number,
    authService: AuthService,
  ) => {
    await authService.signUp('tschokri', 'test');
    await authService.signUp('oskar', 'test');
    for (let i = 0; i < amount; i++) {
      await authService.signUp(
        generateRandomValidUsername(),
        faker.internet.password(),
      );
    }
  };

  private generateAndInsertWinemakers = async (
    amount: number,
    winemakersService: WinemakersService,
  ) => {
    for (let i = 0; i < amount; i++) {
      await winemakersService.create(faker.person.fullName());
    }
  };

  private generateAndInsertStores = async (
    amount: number,
    storesService: StoresService,
  ) => {
    for (let i = 0; i < amount; i++) {
      const store = await storesService.create(
        faker.company.name(),
        faker.location.streetAddress(),
        faker.internet.url(),
      );
      const buffer: Buffer = await getImageBufferFromUrl(
        faker.image.urlLoremFlickr({
          width: 200,
          height: 200,
          category: 'storefront',
        }),
      );
      await storesService.updateImage(store, buffer);
    }
  };

  private generateAndInsertWines = async (
    amount: number,
    winemakers: Winemaker[],
    stores: Store[],
    winesService: WinesService,
  ) => {
    const potentialWinemakers: Winemaker[] = randomizeArray(winemakers, amount);
    const potentialStores: Store[] = randomizeArray(stores, amount);

    for (let i = 0; i < amount; i++) {
      await winesService.create(
        `${faker.color.human()} ${faker.animal.cow()}`,
        faker.date.anytime().getFullYear(),
        potentialWinemakers.pop()!.id,
        [potentialStores.pop()!.id],
        faker.animal.cetacean(),
        faker.location.country(),
      );
    }
  };

  private generateAndInsertRatings = async (
    amountPerUser: number,
    users: User[],
    wines: Wine[],
    ratingsService: RatingsService,
  ) => {
    for (const user of users) {
      const wineIndexes: number[] = generateRandomUniqueNumbers(
        amountPerUser,
        wines.length,
      );
      for (const index of wineIndexes) {
        await ratingsService.create(
          faker.number.int({ min: STARS_MIN, max: STARS_MAX }),
          faker.lorem.sentence(),
          user,
          wines[index],
        );
      }
    }
  };

  private generateAndInsertFriendships = async (
    groupSize: number,
    users: User[],
    usersService: UsersService,
  ) => {
    const generateAndInsertFriendshipsByGroup = async (group: User[]) => {
      for (let i = 0; i < group.length; i++) {
        const currUser: User = group[i];
        for (let j = i + 1; j < group.length; j++) {
          const user = group[j];
          await usersService.addFriend(currUser, user);
        }
      }
    };

    const groupedUsers: User[][] = groupArray(users, groupSize);
    for (const group of groupedUsers) {
      await generateAndInsertFriendshipsByGroup(group);
    }
  };
}
