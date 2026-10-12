import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { ChatService } from './chat.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ListMessagesQuery } from './dto/list-messages.query.js';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listConversations(@CurrentUser() user: AuthUser) {
    return this.chat.listConversations(user);
  }

  @Post('conversations')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createConversation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chat.createConversation(user, dto);
  }

  @Get('conversations/:id')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.detail(user, id);
  }

  @Get('conversations/:id/messages')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ListMessagesQuery,
  ) {
    return this.chat.listMessages(user, id, query);
  }

  @Post('conversations/:id/messages')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(user, id, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(200)
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chat.markRead(user, id);
  }
}
