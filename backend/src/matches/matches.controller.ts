import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException
} from '@nestjs/common';

import { ApproveMatchResponseDto, MatchResponseDto } from './dto/match-response.dto';
import { MatchesService } from './matches.service';

const USER_ID_HEADER = 'x-user-id';

@Controller('match')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('apply/:postId')
  @HttpCode(HttpStatus.CREATED)
  async applyForPost(
    @Headers(USER_ID_HEADER) rawUserId: string | undefined,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string
  ): Promise<MatchResponseDto> {
    if (!rawUserId) {
      throw new UnauthorizedException('Missing authenticated user id');
    }

    const userId = await new ParseUUIDPipe({ version: '4' }).transform(rawUserId, {
      type: 'custom',
      metatype: String,
      data: USER_ID_HEADER
    });

    return this.matchesService.applyForPost(userId, postId);
  }

  @Patch('approve/:matchId')
  async approveMatch(
    @Headers(USER_ID_HEADER) rawUserId: string | undefined,
    @Param('matchId', new ParseUUIDPipe({ version: '4' })) matchId: string
  ): Promise<ApproveMatchResponseDto> {
    if (!rawUserId) {
      throw new UnauthorizedException('Missing authenticated user id');
    }

    const userId = await new ParseUUIDPipe({ version: '4' }).transform(rawUserId, {
      type: 'custom',
      metatype: String,
      data: USER_ID_HEADER
    });

    return this.matchesService.approveMatch(userId, matchId);
  }
}
