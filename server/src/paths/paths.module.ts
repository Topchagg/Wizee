import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrerequisitesModule } from '../prerequisites/prerequisites.module';
import { PathsController } from './paths.controller';
import { PathsService } from './paths.service';

@Module({
  imports: [AuthModule, PrerequisitesModule],
  controllers: [PathsController],
  providers: [PathsService],
})
export class PathsModule {}
