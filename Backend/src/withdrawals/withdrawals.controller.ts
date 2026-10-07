import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { WithdrawalsService } from './withdrawals.service.js';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto.js';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class WithdrawalsController {
  constructor(private withdrawals: WithdrawalsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawals.create(user.userId, dto);
  }

  @Get()
  listAll() {
    return this.withdrawals.listAll();
  }

  @Patch(':id/refresh-status')
  refreshStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.withdrawals.refreshStatus(id);
  }
}
