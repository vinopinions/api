import { Module } from '@nestjs/common';
import { RatingsModule } from '../ratings/ratings.module';
import { UsersModule } from '../users/users.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  providers: [FeedService],
  controllers: [FeedController],
  imports: [RatingsModule, UsersModule],
})
export class FeedModule {}
