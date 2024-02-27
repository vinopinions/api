import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { Rating } from '../ratings/entities/rating.entity';
import { FeedService } from './feed.service';

const FEED_ENDPOINT_NAME = 'feed';
export const FEED_ENDPOINT = `/${FEED_ENDPOINT_NAME}`;
@Controller(FEED_ENDPOINT_NAME)
@ApiTags(FEED_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class FeedController {
  constructor(private feedService: FeedService) {}

  @ApiOperation({ summary: 'get your feed' })
  @HttpCode(HttpStatus.OK)
  @Get(FEED_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Feed has been created',
    type: Rating,
    isArray: true,
  })
  getCurrentUser(@Req() request: AuthenticatedRequest): Promise<Rating[]> {
    return this.feedService.getFeedForUser(request.user);
  }
}
