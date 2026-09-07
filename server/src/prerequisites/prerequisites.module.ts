import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  DependentsController,
  PrerequisitesController,
} from './prerequisites.controller';
import { PrerequisitesService } from './prerequisites.service';

@Module({
  imports: [AuthModule],
  controllers: [PrerequisitesController, DependentsController],
  providers: [PrerequisitesService],
  exports: [PrerequisitesService],
})
export class PrerequisitesModule {}
