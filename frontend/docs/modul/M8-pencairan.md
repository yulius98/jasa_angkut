# M8 — Pencairan (Withdrawal)

**Tujuan:** admin membuat permintaan pencairan dana ke rekening bank dan memantau
statusnya.

**Status:** ⬜ Belum · **Bergantung pada:** M0, M1

---

## Endpoint Backend

| Method | Path | Body | Keterangan |
|---|---|---|---|
| GET | `/admin/withdrawals` | – | daftar semua withdrawal |
| POST | `/admin/withdrawals` | lihat bawah | membuat payout |
| PATCH | `/admin/withdrawals/:id/refresh-status` | – | sinkron status dari provider |

Body create:
`beneficiaryName` (≤100), `bankCode` (≤20), `bankAccountNumber` (≤50),
`amount` (int >0), `notes?` (≤255), `provider?` (`IRIS`|`XENDIT`, default `IRIS`).

**Format `bankCode` berbeda per provider:**
- `IRIS`: kode bank biasa (mis. `BCA`, `BNI`, `MANDIRI`).
- `XENDIT`: channel code Xendit (mis. `ID_BCA`, `ID_BNI`).

Catatan penting: sistem **hanya membuat** payout (role Creator) — **tidak** ada
auto-approve. Approval dilakukan terpisah di dashboard provider. Tampilkan info ini.

Field `status` = status dari provider (mis. `pending`, `submitted`, `failed`,
atau status asli Iris setelah sinkron).

---

## Rancangan

### Halaman `/withdrawals`
- Tabel: `referenceNo`, provider, `beneficiaryName`, `bankCode`/`bankAccountNumber`,
  `amount` (Rupiah), `status`, `submittedAt`, `lastCheckedAt`, `createdAt`.
- Aksi per baris: **Refresh Status** (konfirmasi) → `refresh-status`.
- Tombol **Buat Pencairan** → form (dialog/drawer):
  - Provider (radio IRIS/XENDIT) — mengubah hint `bankCode`.
  - `beneficiaryName`, `bankCode`, `bankAccountNumber`, `amount`, `notes`.
  - Validasi sesuai DTO; nomor rekening sebagai string.
- Tampilkan banner: pembuatan payout tidak otomatis menyetujui dana.

## Komponen
- `DataTable`, `StatusBadge`, `ConfirmDialog`, `CreateWithdrawalDialog`, form + zod,
  `PageHeader`.

---

## Acceptance Criteria

- [ ] List withdrawal tampil (termasuk metadata provider).
- [ ] Form create memvalidasi semua field; hint `bankCode` berubah sesuai provider.
- [ ] Create berhasil membuat record dan menampilkan status dari provider.
- [ ] Kegagalan provider (mis. kredensial/saldo) menampilkan pesan error backend,
  record tercatat sebagai `failed`.
- [ ] Refresh status memperbarui status baris.
- [ ] Ada banner informasi soal tidak adanya auto-approve.
- [ ] `pnpm lint` & `pnpm build` lolos.
