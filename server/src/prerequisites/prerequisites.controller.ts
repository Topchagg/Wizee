import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { PrerequisitesService } from './prerequisites.service';

// Reads are open to any authenticated user — the Path builder and the
// learner-facing "Builds on" note both need them. Writes are SUPERADMIN-only,
// same gate as tree curation itself (see AdminController): prerequisites are
// set manually by whoever is building the tree, not by learners or tutors.
@UseGuards(FirebaseAuthGuard)
@Controller('concepts/:id/prerequisites')
export class PrerequisitesController {
  constructor(private readonly prerequisites: PrerequisitesService) {}

  @Get()
  listDirect(@Param('id') id: string) {
    return this.prerequisites.listDirect(id);
  }

  @Get('transitive')
  listTransitive(@Param('id') id: string) {
    return this.prerequisites.listTransitive(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @Post()
  add(@Param('id') id: string, @Body() dto: AddPrerequisiteDto) {
    return this.prerequisites.add(id, dto.requiresConceptId);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  @Delete(':requiresConceptId')
  remove(
    @Param('id') id: string,
    @Param('requiresConceptId') requiresConceptId: string,
  ) {
    return this.prerequisites.remove(id, requiresConceptId);
  }
}

// Separate route root (/concepts/:id/dependents) so "what depends on this
// Concept" isn't nested awkwardly under /prerequisites, which is always read
// as "what THIS Concept depends on".
@UseGuards(FirebaseAuthGuard)
@Controller('concepts/:id/dependents')
export class DependentsController {
  constructor(private readonly prerequisites: PrerequisitesService) {}

  @Get()
  listDependents(@Param('id') id: string) {
    return this.prerequisites.listDependents(id);
  }
}
