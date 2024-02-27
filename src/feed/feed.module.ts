import { Module } from '@nestjs/common';
import { RatingsModule } from '../ratings/ratings.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  providers: [FeedService],
  controllers: [FeedController],
  imports: [RatingsModule],
})
export class FeedModule {}
