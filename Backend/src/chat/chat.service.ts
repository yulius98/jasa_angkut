import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationType, UserRole } from '../generated/prisma/enums.js';
import type { AuthUser } from '../common/auth-user.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ListMessagesQuery } from './dto/list-messages.query.js';

const USER_BRIEF = { select: { id: true, name: true, role: true } } as const;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: AuthUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  async listConversations(user: AuthUser) {
    // Admin melihat seluruh ruang dukungan; customer/partner melihat ruang yang
    // mereka ikuti (order miliknya atau tiket dukungannya sendiri).
    const where: Record<string, unknown> = this.isAdmin(user)
      ? { type: ConversationType.SUPPORT }
      : { participants: { some: { userId: user.userId } } };

    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        participants: {
          select: { userId: true, lastReadAt: true, user: USER_BRIEF },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true },
        },
      },
    });

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const me = conversation.participants.find(
          (p) => p.userId === user.userId,
        );
        const unreadCount = me
          ? await this.prisma.chatMessage.count({
              where: {
                conversationId: conversation.id,
                senderId: { not: user.userId },
                ...(me.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
              },
            })
          : 0;
        return {
          id: conversation.id,
          type: conversation.type,
          orderId: conversation.orderId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          order: conversation.order,
          participants: conversation.participants,
          lastMessage: conversation.messages[0] ?? null,
          unreadCount,
        };
      }),
    );

    return { data };
  }

  async createConversation(user: AuthUser, dto: CreateConversationDto) {
    if (dto.type === ConversationType.ORDER) {
      if (!dto.orderId) {
        throw new BadRequestException('orderId wajib diisi untuk chat order');
      }
      return this.getOrCreateOrderConversation(user, dto.orderId);
    }
    return this.getOrCreateSupportConversation(user);
  }

  async detail(user: AuthUser, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        participants: { select: { userId: true, user: USER_BRIEF } },
      },
    });
    if (!conversation) throw new NotFoundException('Percakapan tidak ditemukan');
    this.assertAccess(user, conversation);
    return conversation;
  }

  async listMessages(
    user: AuthUser,
    conversationId: string,
    query: ListMessagesQuery,
  ) {
    await this.detail(user, conversationId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { sender: USER_BRIEF },
      }),
      this.prisma.chatMessage.count({ where: { conversationId } }),
    ]);

    // Ambil dari yang terbaru agar paginasi benar, lalu balik agar klien
    // menerima urutan kronologis (paling lama -> paling baru).
    return { data: rows.reverse(), meta: { page, limit, total } };
  }

  async sendMessage(
    user: AuthUser,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    await this.detail(user, conversationId);
    // Admin bisa membalas tanpa pernah membuka ruang lebih dulu -- daftarkan
    // ia sebagai peserta saat pesan pertama dikirim.
    await this.ensureParticipant(conversationId, user.userId);

    const message = await this.prisma.chatMessage.create({
      data: { conversationId, senderId: user.userId, body: dto.body },
      include: { sender: USER_BRIEF },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: user.userId } },
      update: { lastReadAt: new Date() },
      create: {
        conversationId,
        userId: user.userId,
        lastReadAt: new Date(),
      },
    });
    return message;
  }

  async markRead(user: AuthUser, conversationId: string) {
    await this.detail(user, conversationId);
    await this.ensureParticipant(conversationId, user.userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.userId } },
      data: { lastReadAt: new Date() },
    });
    return { message: 'Ditandai sudah dibaca' };
  }

  private async getOrCreateSupportConversation(user: AuthUser) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.SUPPORT,
        participants: { some: { userId: user.userId } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return this.detail(user, existing.id);

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.SUPPORT,
        participants: { create: { userId: user.userId } },
      },
    });
    return this.detail(user, conversation.id);
  }

  private async getOrCreateOrderConversation(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, partner: true },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');

    // Hanya customer pemilik order atau partner yang mengerjakannya (plus admin)
    // yang boleh membuka ruang chat order ini.
    const isCustomer = order.customer.userId === user.userId;
    const isPartner = order.partner?.userId === user.userId;
    if (!isCustomer && !isPartner && !this.isAdmin(user)) {
      throw new ForbiddenException('Kamu bukan bagian dari order ini');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: { type: ConversationType.ORDER, orderId },
    });
    if (existing) return this.detail(user, existing.id);

    const participantIds = [order.customer.userId, order.partner?.userId].filter(
      (id): id is string => Boolean(id),
    );

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.ORDER,
        orderId,
        participants: { create: participantIds.map((userId) => ({ userId })) },
      },
    });
    return this.detail(user, conversation.id);
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: {},
      create: { conversationId, userId },
    });
  }

  private assertAccess(
    user: AuthUser,
    conversation: { participants: { userId: string }[] },
  ) {
    if (this.isAdmin(user)) return;
    const allowed = conversation.participants.some(
      (p) => p.userId === user.userId,
    );
    if (!allowed) {
      throw new ForbiddenException('Kamu tidak punya akses ke percakapan ini');
    }
  }
}
