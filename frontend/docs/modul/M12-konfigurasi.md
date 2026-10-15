# M12 — Konfigurasi & Public Config

**Tujuan:** satu tempat untuk mengelola konfigurasi yang dipakai lintas aplikasi
(admin, pelanggan, mitra) — terutama **API key Google Maps** — plus halaman status
untuk memantaunya.

**Status:** ✅ Selesai · **Bergantung pada:** M0, M1

---

## Latar belakang

Sebelumnya API key Google Maps tersebar sebagai `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
di `.env.local` tiap frontend (admin, pelanggan, mitra). Nilai `NEXT_PUBLIC_*`
di-inline saat build dan hanya dibaca dari folder app masing-masing, sehingga:

- satu key harus diperbarui di 3 tempat,
- ganti key butuh rebuild/redeploy tiap frontend.

Solusinya: **Backend jadi satu-satunya sumber.** Backend menyimpan nilainya di
`Backend/.env` lalu menyajikannya lewat endpoint publik; frontend mengambilnya
saat render (Server Component) dan meneruskannya ke komponen peta.

> Catatan: key Google Maps JavaScript API memang terlihat di browser — itu sifat
> API-nya. Yang melindungi bukan kerahasiaan key, melainkan **HTTP referrer
> restriction + API restriction** di Google Cloud Console.

---

## Endpoint Backend (modul `PublicConfigModule`)

| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/config/public` | publik | Konfigurasi publik (API key Maps, brand, kontak dukungan, versi minimum app). |
| POST | `/config/public/revalidate` | ADMIN, SUPER_ADMIN | Menghapus cache in-memory config publik → seluruh frontend menerima nilai terbaru. |
| GET | `/config/health` | publik | Status, versi, uptime, waktu server. |

Bentuk response `GET /config/public`:

```jsonc
{
  "appName": "Jasa Antar",
  "googleMapsApiKey": "AIza...",
  "supportWhatsapp": "",
  "supportEmail": "",
  "minAppVersion": ""
}
```

Bentuk response `GET /config/health`:

```jsonc
{
  "status": "ok",
  "version": "1.0.0",
  "uptimeSeconds": 123,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Environment (Backend/.env)

| Variabel | Default | Dipakai untuk |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | – | Peta & geocoding di ketiga frontend |
| `PUBLIC_APP_NAME` | `Jasa Antar` | Nama brand |
| `PUBLIC_SUPPORT_WHATSAPP` | – | Kontak WhatsApp dukungan |
| `PUBLIC_SUPPORT_EMAIL` | – | Kontak email dukungan |
| `PUBLIC_MIN_APP_VERSION` | – | Versi minimum app yang didukung |
| `PUBLIC_CONFIG_CACHE_TTL_SECONDS` | `3600` | Lama cache in-memory config publik (detik) |
| `APP_VERSION` | `0.0.0` | Versi build di `/config/health` |

`PublicConfigService` menyimpan hasilnya di cache in-memory (TTL di atas) dan
mengekspos `revalidate()` untuk menyusun ulang tanpa restart.

---

## Frontend

### Helper (ketiga app)

`lib/server-config.ts`:

- `getPublicConfig(): Promise<PublicConfig>`
- `getGoogleMapsApiKey(): Promise<string>`
- `getBackendHealth(): Promise<BackendHealth | null>`

Semua memakai `fetch(..., { cache: "no-store" })` — jadi setelah admin menekan
**Refresh konfigurasi**, semua app langsung membaca nilai terbaru (tanpa menunggu
TTL cache). Bila backend tidak dapat dihubungi, helper mengembalikan nilai default
agar halaman tetap render (peta jatuh ke tampilan "belum dikonfigurasi").

### Pemakaian

- **Peta** (admin/pelanggan/mitra): Server Component memanggil
  `getGoogleMapsApiKey()` lalu meneruskannya sebagai prop `apiKey` ke `OrderMap` /
  `LocationPicker`.
- **Brand admin**: `app/(dashboard)/layout.tsx` mengambil `appName` dan
  meneruskannya ke `AdminShell` → `AppSidebar`.
- **Kontak dukungan** (pelanggan & mitra): kartu "Bantuan" di halaman `/account`
  menampilkan tautan WhatsApp (`wa.me`) & email bila diisi.

### Halaman Konfigurasi (admin)

- Route: `/config` (`app/(dashboard)/config/page.tsx`, Server Component).
- Menampilkan: identitas & dukungan, status Google Maps (key di-mask), dan status
  backend (`/config/health`).
- Tombol **Refresh konfigurasi** (`components/config/refresh-config-button.tsx`)
  memanggil server action `revalidatePublicConfig()` (`lib/actions/public-config.ts`)
  → `POST /config/public/revalidate`, lalu `router.refresh()`.

---

## Acceptance Criteria

- [x] API key Google Maps hanya ada di `Backend/.env`.
- [x] Ketiga frontend mengambil konfigurasi dari `GET /config/public`.
- [x] Endpoint config publik & health bisa diakses tanpa login.
- [x] `POST /config/public/revalidate` hanya untuk ADMIN/SUPER_ADMIN.
- [x] Tombol "Refresh konfigurasi" memperbarui tampilan tanpa restart.
- [x] Bila backend mati, halaman tetap render (fallback), bukan error.
- [x] `tsc`/lint lolos di Backend & ketiga frontend.
