import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PublicConfig {
  appName: string;
  googleMapsApiKey: string;
  supportWhatsapp: string;
  supportEmail: string;
  minAppVersion: string;
}

const DEFAULT_TTL_SECONDS = 3600;

/**
 * Menyusun & menyimpan (cache in-memory) konfigurasi publik.
 *
 * Nilai dibaca dari environment (`Backend/.env`). Cache berumur pendek supaya
 * `POST /config/public/revalidate` bisa memaksa penyusunan ulang tanpa restart
 * — berguna bila sumbernya nanti berpindah ke DB/remote config.
 */
@Injectable()
export class PublicConfigService {
  private cache: { value: PublicConfig; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  get(): PublicConfig {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.value;
    }
    return this.revalidate();
  }

  /** Paksa susun ulang lalu simpan ke cache. Mengembalikan nilai terbaru. */
  revalidate(): PublicConfig {
    const value = this.build();
    this.cache = { value, expiresAt: Date.now() + this.ttlMs() };
    return value;
  }

  private build(): PublicConfig {
    return {
      appName: this.read('PUBLIC_APP_NAME') || 'Jasa Antar',
      googleMapsApiKey: this.read('GOOGLE_MAPS_API_KEY'),
      supportWhatsapp: this.read('PUBLIC_SUPPORT_WHATSAPP'),
      supportEmail: this.read('PUBLIC_SUPPORT_EMAIL'),
      minAppVersion: this.read('PUBLIC_MIN_APP_VERSION'),
    };
  }

  private read(key: string): string {
    return (this.config.get<string>(key) ?? '').trim();
  }

  private ttlMs(): number {
    const parsed = Number(this.read('PUBLIC_CONFIG_CACHE_TTL_SECONDS'));
    const seconds =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_TTL_SECONDS;
    return seconds * 1000;
  }
}
