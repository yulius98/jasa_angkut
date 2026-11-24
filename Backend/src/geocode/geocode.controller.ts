import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { GeocodeService } from './geocode.service.js';
import { SearchAddressQuery } from './dto/search-address.query.js';
import { ReverseGeocodeQuery } from './dto/reverse-geocode.query.js';

/**
 * Endpoint geocoding (alamat → koordinat & koordinat → alamat).
 *
 * Terlindungi JwtAuthGuard: semua role yang sudah login boleh memakai —
 * fitur ini dipakai penyaluran titik jemput/tujuan saat membuat pesanan.
 * RolesGuard tanpa @Roles membiarkan semua user yang sudah terautentikasi.
 */
@Controller('geocode')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeocodeController {
  constructor(private readonly geocode: GeocodeService) {}

  // NB: 'reverse' harus dideklarasikan sebelum route catch-all bila ada;
  // saat ini hanya dua route sehingga aman.
  @Get('reverse')
  async reverse(@Query() query: ReverseGeocodeQuery) {
    return { results: await this.geocode.reverse(query.lat, query.lng) };
  }

  @Get()
  async search(@Query() query: SearchAddressQuery) {
    return { results: await this.geocode.search(query.address) };
  }
}
