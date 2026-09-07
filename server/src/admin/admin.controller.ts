import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateConceptDto } from './dto/create-concept.dto';
import { CreateSubConceptDto } from './dto/create-sub-concept.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateThemeDto } from './dto/create-theme.dto';

// Tree curation — every route here is SUPERADMIN-only (see AdminService's
// class comment for why). The tree is otherwise read via the existing
// /sub-concepts/tree and /paths/tree endpoints, open to any authenticated
// user — this controller only adds to it (and removes from it).
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('subjects')
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.admin.createSubject(dto.title);
  }

  @Post('themes')
  createTheme(@Body() dto: CreateThemeDto) {
    return this.admin.createTheme(dto.subjectId, dto.title);
  }

  @Post('concepts')
  createConcept(@Body() dto: CreateConceptDto) {
    return this.admin.createConcept(dto.themeId, dto.title);
  }

  @Post('sub-concepts')
  createSubConcept(@Body() dto: CreateSubConceptDto) {
    return this.admin.createSubConcept(dto.conceptId, dto.title);
  }

  // Every level cascades — deleting a Subject takes its Themes, Concepts,
  // Sub-concepts, and everything built on them (content, tasks, attempts,
  // watch events, PathItems referencing them) with it. See AdminService.
  @Delete('subjects/:id')
  deleteSubject(@Param('id') id: string) {
    return this.admin.deleteSubject(id);
  }

  @Delete('themes/:id')
  deleteTheme(@Param('id') id: string) {
    return this.admin.deleteTheme(id);
  }

  @Delete('concepts/:id')
  deleteConcept(@Param('id') id: string) {
    return this.admin.deleteConcept(id);
  }

  @Delete('sub-concepts/:id')
  deleteSubConcept(@Param('id') id: string) {
    return this.admin.deleteSubConcept(id);
  }
}
