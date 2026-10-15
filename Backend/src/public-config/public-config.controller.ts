import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../generated/prisma/enums.js';
import { PublicConfigService } from './public-config.service.js';

/**
 * Endpoint konfigurasi aplikasi.
 *
 * `GET /config/public` & `GET /config/health` sengaja publik (TANPA
 * JwtAuthGuard) karena isinya memang boleh diketahui klien — mis. API key
 * Google Maps, yang tetap terekspos di browser karena dipakai Maps JavaScript
 * API. Nilainya bersumber dari `Backend/.env` sebagai satu-satunya tempat
 * konfigurasi, lalu dikonsumsi frontend (admin, pelanggan, mitra). Lihat juga
 * `lib/server-config.ts` di tiap frontend.
 */
@Controller('config')
export class PublicConfigController {
  constructor(
    private readonly publicConfig: PublicConfigService,
    private readonly config: ConfigService,
  ) {}

  @Get('public')
  getPublicConfig() {
    return this.publicConfig.get();
  }

  /** Menghapus cache config publik agar seluruh frontend mengambil nilai terbaru. */
  @Post('public/revalidate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  revalidatePublicConfig() {
    return this.publicConfig.revalidate();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      version: this.config.get<string>('APP_VERSION') ?? '0.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
