import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import {
  type ApproveMatchResponseDto,
  type MatchResponseDto,
  toChatRoomResponseDto,
  toMatchResponseDto
} from './dto/match-response.dto';
import { MatchStatus } from './entities/match.entity';
import { MatchesRepository } from './matches.repository';

const MATCH_EXPIRATION_MINUTES = 20;

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchesRepository: MatchesRepository,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService
  ) {}

  async applyForPost(applicantId: string, postId: string): Promise<MatchResponseDto> {
    const applicant = await this.usersService.findById(applicantId);
    if (!applicant) {
      throw new NotFoundException('Applicant user not found');
    }

    const post = await this.postsService.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId === applicantId) {
      throw new BadRequestException('Cannot apply to own post');
    }

    const existingMatch = await this.matchesRepository.findActiveByPostAndApplicant(postId, applicantId);
    if (existingMatch) {
      throw new ConflictException('Match request already exists');
    }

    const expiresAt = new Date(Date.now() + MATCH_EXPIRATION_MINUTES * 60 * 1000);
    const createdMatch = await this.matchesRepository.createMatch({
      postId,
      applicantId,
      expiresAt
    });

    return toMatchResponseDto(createdMatch);
  }

  async approveMatch(requesterId: string, matchId: string): Promise<ApproveMatchResponseDto> {
    const matchWithPost = await this.matchesRepository.findByIdWithPost(matchId);
    if (!matchWithPost) {
      throw new NotFoundException('Match not found');
    }

    if (matchWithPost.status !== MatchStatus.Pending) {
      throw new ConflictException('Match is not pending');
    }

    if (matchWithPost.postUserId !== requesterId) {
      throw new ForbiddenException('Only the post owner can approve matches');
    }

    if (matchWithPost.expiresAt.getTime() < Date.now()) {
      throw new ConflictException('Match request has expired');
    }

    const approvalResult = await this.matchesRepository.approveMatch(
      matchId,
      matchWithPost.postUserId,
      matchWithPost.applicantId
    );

    return {
      match: toMatchResponseDto(approvalResult.match),
      chatRoom: toChatRoomResponseDto(approvalResult.chatRoom)
    };
  }
}
