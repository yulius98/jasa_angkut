import { Max, Min } from 'class-validator';

export class PasswordResetSettingsDto {
  /** Masa berlaku link "lupa password" dalam jam (1..720 = 30 hari). */
  @Min(1)
  @Max(720)
  ttlHours: number;
}
