import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ListPaymentsQuery } from './dto/list-payments.query.js';
import { UpdateGatewaySettingDto } from './dto/update-gateway-setting.dto.js';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.payments.create(user.userId, dto);
  }

  // Setting gateway pembayaran global (MIDTRANS | XENDIT) yang dipilih admin.
  // Dipakai sebagai default semua pembayaran non-tunai baru.
  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettings() {
    return { paymentGateway: await this.payments.getPaymentGatewaySetting() };
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSettings(@Body() dto: UpdateGatewaySettingDto) {
    const paymentGateway = await this.payments.updatePaymentGatewaySetting(dto.paymentGateway);
    return { paymentGateway };
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  markCashPaid(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.payments.markCashPaid(user, id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listAll(@Query() query: ListPaymentsQuery) {
    return this.payments.listAll(query);
  }

  @Get('order/:orderId')
  @Roles(UserRole.CUSTOMER, UserRole.PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getForOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @CurrentUser() user: AuthUser) {
    return this.payments.getForOrder(user, orderId);
  }
}
