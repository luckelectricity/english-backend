import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    // 测试数据库连接
    const userCount = await this.prisma.user.count();
    const wordCount = await this.prisma.word.count();
    const oxfordCount = await this.prisma.oxfordWord.count();

    return {
      database: 'connected',
      stats: {
        users: userCount,
        words: wordCount,
        oxfordWords: oxfordCount,
      },
    };
  }
}
