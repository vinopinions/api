import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { ApiPaginationResponse } from '../pagination/ApiPaginationResponse';
import { PageDto } from '../pagination/page.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
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
  @Get()
  @ApiPaginationResponse(Rating, { status: HttpStatus.OK })
  async getCurrentUser(
    @Req() request: AuthenticatedRequest,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    console.log(paginationOptionsDto);
    return this.feedService.getFeedForUser(request.user, paginationOptionsDto);
  }
}
