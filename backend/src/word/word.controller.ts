import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    Patch,
} from '@nestjs/common';
import { WordService } from './word.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordController {
    constructor(private wordService: WordService) { }

    @Post()
    async createWord(@CurrentUser() user, @Body() dto: CreateWordDto) {
        return this.wordService.createWord(user.id, dto);
    }

    @Get()
    async getUserWords(@CurrentUser() user) {
        return this.wordService.getUserWords(user.id);
    }

    @Delete(':id')
    async deleteWord(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.wordService.deleteWord(user.id, id);
    }

    @Get('oxford-progress')
    async getOxfordProgress(@CurrentUser() user) {
        return this.wordService.getOxfordProgress(user.id);
    }

    @Patch(':id')
    async updateWord(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWordDto,
    ) {
        return this.wordService.updateWord(user.id, id, dto);
    }
}
