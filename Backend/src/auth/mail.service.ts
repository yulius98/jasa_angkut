import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Mengirim email via SMTP (nodemailer). Belum di-konfigurasi di dev:
 * `SMTP_HOST` kosong -- service ini tidak akan mengirim apa pun, hanya
 * mencatat peringatan ke console backend. Call site yang membutuhkan tahu
 * bahwa email gagal terkirim (mis. flow lupa password, untuk memberi tahu
 * URL/reset ke developer) memanggil `configured` dan `sendMail()` sendiri.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  /** true bila SMTP sudah diisi di Environment -- email benar-benar terkirim. */
  get configured(): boolean {
    return Boolean(this.config.get<string>('SMTP_HOST'));
  }

  /** false bila gagal terkirim (SMTP tak diatur / server SMTP menolak). */
  async sendMail(params: SendMailParams): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(
        `SMTP belum dikonfigurasi (SMTP_HOST kosong). Email "${params.subject}" ` +
          `ke ${params.to} TIDAK terkirim. Isi SMTP_* di Backend/.env untuk ` +
          'mengaktifkan pengiriman email.',
      );
      return false;
    }
    try {
      const client = this.transporter ?? this.createTransporter();
      await client.sendMail({
        from: this.config.get<string>('MAIL_FROM') ||
          'Jasa Antar <no-reply@jasaantar.local>',
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Gagal mengirim email "${params.subject}" ke ${params.to}: ${String(error)}`,
      );
      return false;
    }
  }

  private createTransporter(): Transporter {
    const host = this.config.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.config.get('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
    return this.transporter;
  }
}
