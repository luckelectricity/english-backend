import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        this.logger.log(`注册请求: ${dto.email}`);

        // 检查邮箱是否已存在
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            this.logger.warn(`注册失败: 邮箱已存在 - ${dto.email}`);
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

        this.logger.log(`用户注册成功: ${user.email} (ID: ${user.id})`);

        return {
            user,
            token,
        };
    }

    async login(dto: LoginDto) {
        this.logger.log(`登录请求: ${dto.email}`);

        // 查询用户
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            this.logger.warn(`登录失败: 用户不存在 - ${dto.email}`);
            throw new UnauthorizedException('邮箱或密码错误');
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            this.logger.warn(`登录失败: 密码错误 - ${dto.email}`);
            throw new UnauthorizedException('邮箱或密码错误');
        }

        // 生成 JWT Token
        const token = this.generateToken(user.id, user.email);

        this.logger.log(`用户登录成功: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

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
