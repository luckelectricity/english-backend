import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('analyze')
    @Roles(Role.VIP, Role.VVIP, Role.ADMIN)
    async analyzeWord(
        @Body() body: { word: string; sentence: string },
    ) {
        const meaning = await this.aiService.analyzeWord(body.word, body.sentence);
        return { word: body.word, meaning };
    }

    @Post('expand')
    @Roles(Role.VIP, Role.VVIP, Role.ADMIN)
    async expandWord(
        @Body() body: { word: string; sentence: string },
    ) {
        return this.aiService.expandTutor(body.word, body.sentence);
    }
}
