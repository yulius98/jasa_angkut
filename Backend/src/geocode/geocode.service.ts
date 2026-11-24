import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodeHit {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface GoogleGeocodeResponse {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESULTS = 5;

/**
 * Geocoding server-side lewat Google Geocoding REST API.
 *
 * Dipanggil lewat server, bukan `google.maps.Geocoder` di browser, supaya:
 * - pemakaian Geocoding API terkonsolidasi di satu tempat (mudah di-rate-limit,
 *   di-log, dan diganti provider),
 * - bebas dari pembatasan referrer/HTTP-restriction pada API key yang membuat
 *   pemanggilan Geocoder dari JS sering ditolak (`REQUEST_DENIED`).
 *
 * API key dibaca dari `Backend/.env`. Google melarang key ber-restriction
 * HTTP-referrer dipakai untuk REST web service, jadi geocoding memakai key
 * server sendiri (`GOOGLE_MAPS_SERVER_KEY`, restriction "None"/IP); bila belum
 * ada, fallback ke `GOOGLE_MAPS_API_KEY` (key browser) untuk kompatibilitas.
 * Bila key belum mengaktifkan Geocoding API di Google Cloud Console, error
 * disampaikan apa adanya lewat 503 agar frontend bisa menampilkan pesan yang
 * jelas.
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Key khusus server-side (tanpa referrer restriction). Diisi kalau key
   * browser (`GOOGLE_MAPS_API_KEY`) ber-restriction HTTP referrer, karena
   * Google menolak key begini untuk Geocoding REST.
   */
  private get apiKey(): string {
    return (
      (this.config.get<string>('GOOGLE_MAPS_SERVER_KEY') ?? '').trim() ||
      (this.config.get<string>('GOOGLE_MAPS_API_KEY') ?? '').trim()
    );
  }

  /** Cari koordinat dari teks alamat (forward geocoding). */
  async search(address: string): Promise<GeocodeHit[]> {
    return this.request({ address, region: 'id' });
  }

  /** Cari alamat dari koordinat (reverse geocoding). */
  async reverse(lat: number, lng: number): Promise<GeocodeHit[]> {
    return this.request({ latlng: `${lat},${lng}` });
  }

  private async request(
    params: Record<string, string>,
  ): Promise<GeocodeHit[]> {
    const apiKey = this.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Pencarian lokasi belum dikonfigurasi di server.',
      );
    }

    const url = new URL(GOOGLE_GEOCODE_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('key', apiKey);

    let payload: GoogleGeocodeResponse | null;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`Google Geocoding API HTTP ${res.status}`);
        throw new ServiceUnavailableException(
          'Layanan geocoding sedang bermasalah. Coba lagi nanti.',
        );
      }
      payload = (await res.json().catch(() => null)) as
        | GoogleGeocodeResponse
        | null;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.warn(
        `Google Geocoding API tidak dapat dihubungi: ${String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Tidak dapat menghubungi layanan geocoding. Coba lagi nanti.',
      );
    }

    const status = payload?.status ?? '';
    if (status === 'OK') return this.parse(payload);
    if (status === 'ZERO_RESULTS') return [];

    // REQUEST_DENIED biasanya berarti Geocoding API belum diaktifkan/diizinkan
    // untuk API key ini di Google Cloud Console.
    this.logger.warn(`Google Geocoding API ${status}: ${payload?.error_message ?? ''}`);
    throw new ServiceUnavailableException(
      status === 'REQUEST_DENIED'
        ? 'Geocoding API tidak diizinkan untuk API key ini. Aktifkan Geocoding API pada key di Google Cloud Console.'
        : 'Layanan geocoding sedang bermasalah. Coba lagi nanti.',
    );
  }

  private parse(payload: GoogleGeocodeResponse | null): GeocodeHit[] {
    const hits: GeocodeHit[] = [];
    for (const item of payload?.results ?? []) {
      const location = item.geometry?.location;
      if (!location?.lat || !location?.lng || !item.formatted_address) continue;
      hits.push({
        lat: location.lat,
        lng: location.lng,
        formattedAddress: item.formatted_address,
      });
    }
    return hits.slice(0, MAX_RESULTS);
  }
}
