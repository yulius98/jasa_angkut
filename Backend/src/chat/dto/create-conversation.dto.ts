import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ConversationType } from '../../generated/prisma/enums.js';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  // Wajib saat type = ORDER; diabaikan untuk SUPPORT.
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
