import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AdminsService } from './admins.service.js';
import { ListAdminsQuery } from './dto/list-admins.query.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto.js';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto.js';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  list(@Query() query: ListAdminsQuery) {
    return this.admins.list(query);
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.admins.create(dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.admins.update(user.userId, id, dto);
  }

  @Patch(':id/status')
  setActive(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminStatusDto,
  ) {
    return this.admins.setActive(user.userId, id, dto.isActive);
  }

  @Patch(':id/password')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.admins.resetPassword(id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.admins.remove(user.userId, id);
  }
}
