import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { firebaseAdminProvider } from './firebase-admin.provider';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    firebaseAdminProvider,
    FirebaseAuthGuard,
    RolesGuard,
    AuthService,
  ],
  exports: [firebaseAdminProvider, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
