import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        // 优先从 Cloudflare 头部获取真实 IP
        const ip =
            req.headers['cf-connecting-ip'] as string ||
            req.headers['x-real-ip'] as string ||
            req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown';

        return this.authService.login(dto, ip);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user) {
        return user;
    }
}
