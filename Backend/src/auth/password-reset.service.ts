import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from './mail.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

const SETTING_KEY = 'PASSWORD_RESET_TOKEN_HOURS';
const DEFAULT_TTL_HOURS = 24;
const MIN_TTL_HOURS = 1;
const MAX_TTL_HOURS = 720; // 30 hari

// Reset URL harus berasal dari APLIKASI kita, bukan domain arbitrer yang bisa
// disuntik dari request. Origin http:// hanya dibolehkan untuk localhost
// (pembangunan), kalau tidak harus https://.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/i;
const HTTPS_ORIGIN = /^https:\/\/[^\s/]+$/i;

export interface ResetTokenStatus {
  valid: boolean;
  /** INVALID = token tidak pernah ada; USED sudah dipakai; EXPIRED lewat batas waktu. */
  reason: 'INVALID' | 'USED' | 'EXPIRED' | null;
}

/**
 * Flow "Lupa password":
 *  1. POST /auth/password/forgot  -- validasi email TERDAFTAR (400 kalau tidak),
 *     buat token (raw token dikirim via email, di DB cukup hash SHA-256-nya;
 *     DELETE semua token yang belum dipakai milik user sebagaimana "link
 *     terbaru menginihilkan link lama"), lalu kirim link
 *     "<app>/reset-password?token=..." ke email user.
 *  2. GET  /auth/password/reset-token-status -- dipakai halaman reset untuk
 *     memeriksa apakah token masih VALID (juga sebelum menampilkan form).
 *  3. POST /auth/password/reset -- ganti password; token jadi usedAt dan
 *     SEMUA sesi (refresh token) user direvoke supaya perangkat lain yang
 *     masih login tetap dikeluarkan dari akses.
 * Masa berlaku token = setting admin (SystemSetting PASSWORD_RESET_TOKEN_HOURS;
 * default 24 jam, dipengaruhi menu Config di app admin).
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async getSettings() {
    return { ttlHours: await this.ttlHours(), mailConfigured: this.mail.configured };
  }

  async updateSettings(ttlHours: number) {
    await this.prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(ttlHours) },
      create: { key: SETTING_KEY, value: String(ttlHours) },
    });
    return this.getSettings();
  }

  async requestReset(dto: ForgotPasswordDto) {
    // Permintaan reset HARUS jujur dengan hasil validasi email terdaftar -- itu
    // disengaja syarat fitur (hanya email terdaftar yang diterima, pesan
    // "Email belum terdaftar" TAMPIL di modal, bukan generik).
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new BadRequestException('Email belum terdaftar');
    }

    const ttlHours = await this.ttlHours();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await this.prisma.$transaction([
      // Hancurkan permintaan sebelumnya dari user yang sama agar link lama
      // langsung tidak berlaku (tidak menunggu expired sendiri).
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.hash(token), expiresAt },
      }),
    ]);

    const resetUrl = this.buildResetUrl(dto.appUrl, token);
    const sent = await this.mail.sendMail({
      to: user.email,
      subject: 'Setel ulang Password - Jasa Antar',
      text: this.resetEmailText(user.name, resetUrl, ttlHours),
      html: this.resetEmailHtml(user.name, resetUrl, ttlHours),
    });

    // Tanpa SMTP (dev), link reset tidak akan sampai ke email mana pun. Untuk
    // mempermudah pengujian, link ditampilkan hanya di ENV development DAN
    // melalui console backend Logger (grep " PASSWORD_RESET_URL ") -- tidak
    // pernah dikirim di produksi.
    this.logger.log(
      `[PASSWORD_RESET_URL] ${user.email} -> ${resetUrl}` +
        (sent ? '' : ' (email GAGAL terkirim: SMTP belum diatur)'),
    );
    const isProduction = this.config.get('NODE_ENV') === 'production';
    return {
      sent,
      expiresHours: ttlHours,
      expiresAt: expiresAt.toISOString(),
      ...(sent || isProduction ? {} : { devResetUrl: resetUrl }),
    };
  }

  // Dipakai halaman reset untuk memeriksa apakah token masih valid SEBELUM
  // menampilkan form ke user.
  async checkToken(token: string): Promise<ResetTokenStatus> {
    const stored = await this.storedToken(token);
    if (!stored) return { valid: false, reason: 'INVALID' };
    if (stored.user && !stored.user?.isActive) {
      return { valid: false, reason: 'EXPIRED' };
    }
    if (stored.usedAt) return { valid: false, reason: 'USED' };
    if (stored.expiresAt < new Date()) return { valid: false, reason: 'EXPIRED' };
    return { valid: true, reason: null };
  }

  async reset(dto: ResetPasswordDto) {
    const stored = await this.storedToken(dto.token);
    if (!stored) throw new BadRequestException('Link reset password tidak valid');
    if (stored.usedAt) {
      throw new BadRequestException('Link sudah pernah dipakai. Silakan minta link baru.');
    }
    const now = new Date();
    if (stored.expiresAt < now || !stored.user?.isActive) {
      throw new BadRequestException('Link kedaluwarsa. Silakan minta link baru.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: now },
      }),
      // Password berubah = semua perangkat yang masih memegang refresh token
      // lama dikeluarkan (harus login ulang dengan password baru).
      this.prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
    ]);

    return { message: 'Password berhasil diubah. Silakan login dengan password baru.' };
  }

  private async ttlHours(): Promise<number> {
    const raw = await this.prisma.systemSetting.findUnique({ where: { key: SETTING_KEY } });
    const parsed = Number(raw?.value ?? DEFAULT_TTL_HOURS);
    return Number.isFinite(parsed) && parsed >= MIN_TTL_HOURS && parsed <= MAX_TTL_HOURS
      ? Math.round(parsed)
      : DEFAULT_TTL_HOURS;
  }

  private async storedToken(token: string) {
    if (!token) return null;
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hash(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { isActive: true } },
      },
    });
  }

  /**
   * Susun URL halaman reset. Origin dikirim dari frontend (asal halaman login
   * tempat user meminta link), tapi HANYA dipakai bila aman (https:// atau
   * localhost) -- kalau aneh, bertahan dengan URL app yang terdaftar di env.
   */
  private buildResetUrl(appUrl: string | undefined, token: string): string {
    const candidates = [
      (appUrl ?? '').trim().replace(/\/+$/, ''),
      (this.config.get<string>('CUSTOMER_APP_URL') ?? '').replace(/\/+$/, ''),
      (this.config.get<string>('MITRA_APP_URL') ?? '').replace(/\/+$/, ''),
      (this.config.get<string>('ADMIN_APP_URL') ?? '').replace(/\/+$/, ''),
    ].filter(Boolean);
    const base = candidates.find(
      (value) => LOCAL_ORIGIN.test(value) || HTTPS_ORIGIN.test(value),
    );
    return `${base}/reset-password?token=${token}`;
  }

  private resetEmailText(name: string, resetUrl: string, hours: number): string {
    return (
      `Halo ${name},\n\n` +
      'Kami menerima permintaan pembaharuan password akun kamu.\n' +
      `Klik tautan di bawah untuk mengganti password:\n\n${resetUrl}\n\n` +
      `Tautan ini hanya berlaku ${hours} jam dan hanya bisa dipakai ` +
      'satu kali. Abaikan email ini bila kamu tidak meminta penggantian ' +
      'password -- password kamu tidak akan berubah.\n\n' +
      'Jasa Antar'
    );
  }

  private resetEmailHtml(name: string, resetUrl: string, hours: number): string {
    const escapedUrl = resetUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return (
      `<p>Halo ${name.replace(/</g, '&lt;')},</p>` +
      '<p>Kami menerima permintaan pembaharuan password akun kamu.' +
      ' Klik tombol di bawah untuk mengganti password:</p>' +
      `<p><a href="${escapedUrl}" ` +
      'style="display:inline-block;padding:10px 20px;' +
      'background-color:#16a34a;color:#ffffff;border-radius:8px;' +
      'text-decoration:none">Ganti Password</a></p>' +
      `<p style="color:#64748b;font-size:12px">Atau salin tautan ini ke ` +
      `browser: ${escapedUrl}</p>` +
      `<p style="color:#64748b;font-size:12px">Tautan ini berlaku ${hours} jam` +
      ' dan hanya bisa dipakai satu kali. Abaikan email ini bila kamu' +
      ' tidak meminta penggantian password.</p>' +
      '<p>Jasa Antar</p>'
    );
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
