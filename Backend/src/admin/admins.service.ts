import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '../generated/prisma/enums.js';
import { ListAdminsQuery } from './dto/list-admins.query.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto.js';

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

const ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
  adminProfile: { select: { tier: true } },
} as const;

const TIER_BY_ROLE: Partial<Record<UserRole, string>> = {
  [UserRole.ADMIN]: 'staff',
  [UserRole.SUPER_ADMIN]: 'super_admin',
};

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async list(query: ListAdminsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where = {
      role: query.role ?? { in: ADMIN_ROLES },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: ADMIN_SELECT,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async create(dto: CreateAdminDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Email atau nomor telepon sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        isVerified: true,
        adminProfile: { create: { tier: TIER_BY_ROLE[dto.role] ?? 'staff' } },
      },
      select: ADMIN_SELECT,
    });
  }

  async update(actorId: string, id: string, dto: UpdateAdminDto) {
    const target = await this.findAdminOrFail(id);
    const changingRole = dto.role !== undefined && dto.role !== target.role;
    const changingPhone = dto.phone !== undefined && dto.phone !== target.phone;

    if (changingRole) {
      if (id === actorId) {
        throw new BadRequestException('Tidak dapat mengubah role akun sendiri');
      }
      if (target.role === UserRole.SUPER_ADMIN) {
        await this.assertNotLastSuperAdmin(target);
      }
    }

    if (changingPhone) {
      const duplicate = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('Nomor telepon sudah terdaftar');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(changingRole
          ? {
              role: dto.role,
              adminProfile: {
                upsert: {
                  create: { tier: TIER_BY_ROLE[dto.role!] ?? 'staff' },
                  update: { tier: TIER_BY_ROLE[dto.role!] ?? 'staff' },
                },
              },
            }
          : {}),
      },
      select: ADMIN_SELECT,
    });
  }

  async setActive(actorId: string, id: string, isActive: boolean) {
    const target = await this.findAdminOrFail(id);

    if (!isActive) {
      if (id === actorId) {
        throw new BadRequestException('Tidak dapat menonaktifkan akun sendiri');
      }
      if (target.role === UserRole.SUPER_ADMIN) {
        await this.assertNotLastSuperAdmin(target);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive },
        select: ADMIN_SELECT,
      });
      if (!isActive) {
        await tx.refreshToken.deleteMany({ where: { userId: id } });
      }
      return user;
    });
  }

  async resetPassword(id: string, dto: ResetAdminPasswordDto) {
    await this.findAdminOrFail(id);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { passwordHash },
        select: { id: true, email: true },
      });
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      return user;
    });
  }

  async remove(actorId: string, id: string) {
    const target = await this.findAdminOrFail(id);

    if (id === actorId) {
      throw new BadRequestException('Tidak dapat menghapus akun sendiri');
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      await this.assertNotLastSuperAdmin(target);
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Akun admin berhasil dihapus' };
  }

  private async findAdminOrFail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new NotFoundException('Akun admin tidak ditemukan');
    }
    return user;
  }

  // Cegah sistem kehilangan seluruh super admin aktif.
  private async assertNotLastSuperAdmin(target: { isActive: boolean }) {
    if (!target.isActive) return;
    const activeSuperAdmins = await this.prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN, isActive: true },
    });
    if (activeSuperAdmins <= 1) {
      throw new BadRequestException(
        'Tidak dapat mengubah super admin terakhir yang masih aktif',
      );
    }
  }
}
