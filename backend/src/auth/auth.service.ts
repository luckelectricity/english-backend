import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        // 检查邮箱是否已存在
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('邮箱已被注册');
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 创建用户
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: 'user', // 默认角色
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        // 生成 JWT Token
        const token = this.generateToken(user.id, user.email);

        return {
            user,
            token,
        };
    }

    async login(dto: LoginDto) {
        // 查询用户
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('邮箱或密码错误');
        }

        // 生成 JWT Token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        };
    }

    private generateToken(userId: number, email: string): string {
        const payload = { sub: userId, email };
        return this.jwtService.sign(payload);
    }
}
