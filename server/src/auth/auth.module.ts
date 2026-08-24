import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { firebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [firebaseAdminProvider, FirebaseAuthGuard],
  exports: [firebaseAdminProvider, FirebaseAuthGuard],
})
export class AuthModule {}
