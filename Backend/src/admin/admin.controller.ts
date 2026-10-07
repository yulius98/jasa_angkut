import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth-user.js';
import { UserRole } from '../generated/prisma/enums.js';
import { AdminService } from './admin.service.js';
import { ListDisputesQuery } from './dto/list-disputes.query.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';
import { BalanceQueryDto } from './dto/balance-query.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('midtrans/balance')
  getMidtransBalance(@Query() query: BalanceQueryDto) {
    return this.admin.getMidtransBalance(query);
  }

  @Get('disputes')
  listDisputes(@Query() query: ListDisputesQuery) {
    return this.admin.listDisputes(query);
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.admin.resolveDispute(user.userId, id, dto);
  }
}
