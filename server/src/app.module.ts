import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PathsModule } from './paths/paths.module';
import { PrerequisitesModule } from './prerequisites/prerequisites.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubConceptsModule } from './sub-concepts/sub-concepts.module';
import { SuggestionsModule } from './suggestions/suggestions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    SubConceptsModule,
    PathsModule,
    ChatModule,
    AdminModule,
    SuggestionsModule,
    PrerequisitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
