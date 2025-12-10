import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    private readonly logger = new Logger(AdminController.name);

    constructor(private prisma: PrismaService) { }

    @Get('users')
    async getAllUsers() {
        this.logger.log('管理员查询所有用户');

        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        words: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    @Get('users/:id')
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        this.logger.log(`管理员查询用户详情: ID ${id}`);

        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                vipExpireAt: true,
                vvipExpireAt: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        words: true,
                    },
                },
            },
        });
    }

    @Patch('users/role')
    async updateUserRole(@Body() dto: UpdateUserRoleDto) {
        this.logger.log(`管理员修改用户角色: ${dto.email} -> ${dto.role}`);

        const user = await this.prisma.user.update({
            where: { email: dto.email },
            data: { role: dto.role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true,
            },
        });

        return {
            message: '用户角色更新成功',
            user,
        };
    }

    @Delete('users/:id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        this.logger.warn(`管理员删除用户: ID ${id}`);

        await this.prisma.user.delete({
            where: { id },
        });

        return {
            message: '用户删除成功',
            userId: id,
        };
    }

    @Get('stats')
    async getSystemStats() {
        this.logger.log('管理员查询系统统计');

        const [totalUsers, totalWords, totalContexts, oxfordWords] =
            await Promise.all([
                this.prisma.user.count(),
                this.prisma.word.count(),
                this.prisma.context.count(),
                this.prisma.oxfordWord.count(),
            ]);

        const usersByRole = await this.prisma.user.groupBy({
            by: ['role'],
            _count: true,
        });

        return {
            users: {
                total: totalUsers,
                byRole: usersByRole.reduce((acc, item) => {
                    acc[item.role] = item._count;
                    return acc;
                }, {}),
            },
            words: {
                total: totalWords,
                avgPerUser: totalUsers > 0 ? (totalWords / totalUsers).toFixed(2) : 0,
            },
            contexts: {
                total: totalContexts,
            },
            oxford: {
                total: oxfordWords,
            },
        };
    }
}
