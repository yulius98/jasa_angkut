# Menjalankan Aplikasi Jasa Antar dengan Docker

## Arsitektur yang di-deploy

| Service | Container | Port | Keterangan |
| --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | 5432 (localhost saja) | Database, volume `pgdata` |
| `migrate` | one-off dari `Backend/Dockerfile` target `migrate` | – | `prisma migrate deploy` + seed super admin, jalan sekali |
| `backend` | target `runner` | 3001 | NestJS 12 + Prisma 7, upload di volume `uploads` |
| `admin` | `Dockerfile.frontend` (`frontend`) | 3000 | Dashboard admin |
| `customer` | `Dockerfile.frontend` (`frontend_customer`) | 3002 | Aplikasi pelanggan |
| `landing` | `Dockerfile.frontend` (`frontend_landingpage`) | 3003 | Landing page statis |
| `mitra` | `Dockerfile.frontend` (`frontend_mitra`) | 3004 | Aplikasi driver/mitra |

Alur startup: `postgres` healthy → `migrate` sukses → `backend` healthy → 3 frontend auth start.

## Langkah

```bash
# 1. Siapkan env root (dipakai compose)
cp .env.example .env
#    lalu edit POSTGRES_PASSWORD, CORS_ORIGIN, dan URL domain sesuai environment Anda.

# 2. Pastikan Backend/.env ada berisi kredensial aplikasi
#    (JWT_SECRET, MIDTRANS_*, XENDIT_*, GOOGLE_MAPS_*, SMTP_*, dll).
#    File ini TIDAK ikut ke dalam image; disuntikkan lewat env_file saat runtime.

# 3. Build + jalankan
docker compose up -d --build

# 4. Cek status
docker compose ps
docker compose logs -f backend migrate
```

Akses:

- Landing: http://localhost:3003
- Admin: http://localhost:3000
- Customer: http://localhost:3002
- Mitra: http://localhost:3004
- Health API: http://localhost:3001/config/health

Login admin pertama kali memakai `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(default: `admin@jasa-antar.test` / `Admin12345`, diambil dari `Backend/.env`
atau environment). **Ganti password segera setelah login.**

## Perintah berguna

```bash
docker compose down                 # stop (data remain di volume)
docker compose down -v              # stop + HAPUS database & upload
docker compose up -d --build admin  # rebuild satu service
docker compose exec backend sh      # masuk container API
docker compose exec postgres psql -U postgres -d db_jasa_angkut

# Jalankan ulang migrasi/seed manual
docker compose run --rm migrate
```

## Catatan penting

1. **HTTPS untuk customer/Xendit.** Xendit Components menolak origin `http://`.
   Di produksi, pasang reverse proxy TLS (Nginx/Caddy/Traefik) di depan
   container `customer` dan arahkan `NEXT_PUBLIC_CUSTOMER_APP_URL`,
   `CUSTOMER_APP_URL`, `CORS_ORIGIN`, serta `XENDIT_COMPONENTS_ORIGINS`
   ke domain HTTPS yang sama. Untuk dev lokal dulu bisa pakai mkcert seperti
   yang sudah disiapkan di `frontend_customer/certificates`.

2. **Build-time env.** `NEXT_PUBLIC_*` pada landing page di-inline saat
   `docker build`. Bila domain berubah, lakukan `docker compose up -d --build landing`.
   `BACKEND_URL` pada 3 frontend lain dibaca saat runtime, cukup di compose.

3. **Upload persisten.** Foto KTP/SIM/STNK disimpan di `/app/uploads`
   (volume `uploads`) karena `StorageService` menulis ke disk, bukan ke DB.

4. **Keamanan secrets.** `Backend/.env` saat ini berisi kunci yang terlihat
   seperti kredit nyata (JWT, Midtrans, Xendit, Google Maps). Putar/rotate
   sebelum deploy ke produksi. Jangan pernah commit file `.env`.

5. **Prisma 7.** Client di-generate ke `src/generated/prisma` saat build
   (tidak di-commit), lalu dikompilasi ke `dist/generated/prisma`. Karena itu
   urutan `prisma generate` → `nest build` di Dockerfile tidak boleh dibalik.

6. **Tanpa WebSocket.** Chat dan tracking memakai polling HTTP, sehingga tidak
   ada port atau sticky session tambahan yang perlu disiapkan.
