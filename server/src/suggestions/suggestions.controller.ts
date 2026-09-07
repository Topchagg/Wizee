import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../generated/prisma/client';
import { CreateConceptDto } from '../admin/dto/create-concept.dto';
import { CreateSubConceptDto } from '../admin/dto/create-sub-concept.dto';
import { CreateThemeDto } from '../admin/dto/create-theme.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SuggestionsService } from './suggestions.service';

// Submitting a suggestion is open to any authenticated user (TUTOR, LEARNER,
// or SUPERADMIN) — reviewing the queue is SUPERADMIN-only, same gate as the
// tree curation itself (see AdminController).
@UseGuards(FirebaseAuthGuard)
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Post('themes')
  suggestTheme(@Body() dto: CreateThemeDto, @CurrentUser() user: User) {
    return this.suggestions.suggestTheme(dto.subjectId, dto.title, user.id);
  }

  @Post('concepts')
  suggestConcept(@Body() dto: CreateConceptDto, @CurrentUser() user: User) {
    return this.suggestions.suggestConcept(dto.themeId, dto.title, user.id);
  }

  @Post('sub-concepts')
  suggestSubConcept(
    @Body() dto: CreateSubConceptDto,
    @CurrentUser() user: User,
  ) {
    return this.suggestions.suggestSubConcept(
      dto.conceptId,
      dto.title,
      user.id,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @Get()
  list() {
    return this.suggestions.list();
  }

  // Creates the real tree node via AdminService, then clears the suggestion —
  // see SuggestionsService.approve.
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.suggestions.approve(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @Delete(':id')
  reject(@Param('id') id: string) {
    return this.suggestions.reject(id);
  }
}
