import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubConceptsController } from './sub-concepts.controller';
import { SubConceptsService } from './sub-concepts.service';

@Module({
  imports: [AuthModule],
  controllers: [SubConceptsController],
  providers: [SubConceptsService],
})
export class SubConceptsModule {}
