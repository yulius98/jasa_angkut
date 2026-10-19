import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { PasswordResetSettingsDto } from './dto/password-reset-settings.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth-user.js';
import { UserRole } from '../generated/prisma/enums.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  /** Flow "Lupa password" step 1: validasi email terdaftar + kirim link. */
  @Post('password/forgot')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto);
  }

  /** Flow "Lupa password" step 2: cek apakah token link masih valid. */
  @Get('password/reset-token-status')
  checkResetToken(@Query('token') token: string) {
    return this.passwordReset.checkToken(token ?? '');
  }

  /** Flow "Lupa password" step 3 (FINAL): ganti password pakai token link. */
  @Post('password/reset')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.reset(dto);
  }

  // ===== pengaturan admin (dipakai halaman Konfigurasi di app admin) =====

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('password/settings')
  getResetSettings() {
    return this.passwordReset.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put('password/settings')
  updateResetSettings(@Body() dto: PasswordResetSettingsDto) {
    return this.passwordReset.updateSettings(dto.ttlHours);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
