import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AddContentDto } from './dto/add-content.dto';
import { RecordWatchEventDto } from './dto/record-watch-event.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { SubConceptsService } from './sub-concepts.service';

@UseGuards(FirebaseAuthGuard)
@Controller('sub-concepts')
export class SubConceptsController {
  constructor(private readonly subConcepts: SubConceptsService) {}

  @Get()
  getFirst() {
    return this.subConcepts.getFirst();
  }

  // Must stay registered before ':id' below — Nest/Express matches literal
  // segments in declaration order, and ':id' would otherwise swallow 'tree'.
  @Get('tree')
  getTree() {
    return this.subConcepts.getTree();
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: User) {
    return this.subConcepts.getDetail(id, user.id);
  }

  // ':id' accepts either the raw id or the slug (resolved server-side) — the
  // /learn URL is slug-based, but this keeps old id-based links working too.
  @Get(':id/content/:contentId')
  getContentDetail(
    @Param('id') id: string,
    @Param('contentId') contentId: string,
    @CurrentUser() user: User,
  ) {
    return this.subConcepts.getContentDetail(id, contentId, user.id);
  }

  @Post(':id/content')
  addContent(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: AddContentDto,
  ) {
    return this.subConcepts.addContent(id, user, dto);
  }

  @Post(':id/attempts')
  submitAttempt(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.subConcepts.submitAttempt(id, user.id, dto);
  }

  // "Roll" on the Test step — pool=solvedOnScreen when stuck on an HW task
  // (guaranteed to be worked out in the video), pool=homework to go back to
  // a fresh HW question afterward.
  @Get(':id/content/:contentId/tasks/random')
  getRandomTask(
    @Param('id') id: string,
    @Param('contentId') contentId: string,
    @Query('pool') pool: 'solvedOnScreen' | 'homework',
    @Query('exclude') exclude?: string,
  ) {
    return this.subConcepts.getRandomTask(id, contentId, pool, exclude);
  }

  @Get(':id/content/:contentId/alternative')
  getAlternative(
    @Param('id') id: string,
    @Param('contentId') contentId: string,
    @CurrentUser() user: User,
  ) {
    return this.subConcepts.getAlternative(id, contentId, user.id);
  }

  @Get(':id/next')
  getNext(@Param('id') id: string) {
    return this.subConcepts.getNext(id);
  }

  @Post(':id/watch-events')
  recordWatchEvent(
    @CurrentUser() user: User,
    @Body() dto: RecordWatchEventDto,
  ) {
    return this.subConcepts.recordWatchEvent(user.id, dto);
  }
}
