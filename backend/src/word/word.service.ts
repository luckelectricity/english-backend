import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';

@Injectable()
export class WordService {
    constructor(private prisma: PrismaService) { }

    async createWord(userId: number, dto: CreateWordDto) {
        // 查重: 检查用户是否已有该单词
        const existingWord = await this.prisma.word.findUnique({
            where: {
                text_userId: {
                    text: dto.text.toLowerCase(),
                    userId,
                },
            },
        });

        if (existingWord) {
            // 单词已存在,只添加新的 Context
            await this.prisma.context.create({
                data: {
                    sentence: dto.sentence,
                    meaning: dto.meaning,
                    sourceUrl: dto.sourceUrl,
                    wordId: existingWord.id,
                },
            });

            return this.prisma.word.findUnique({
                where: { id: existingWord.id },
                include: {
                    contexts: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }

        // 单词不存在,创建 Word + Context
        return this.prisma.word.create({
            data: {
                text: dto.text.toLowerCase(),
                userId,
                contexts: {
                    create: {
                        sentence: dto.sentence,
                        meaning: dto.meaning,
                        sourceUrl: dto.sourceUrl,
                    },
                },
            },
            include: {
                contexts: true,
            },
        });
    }

    async getUserWords(userId: number) {
        return this.prisma.word.findMany({
            where: { userId },
            include: {
                contexts: {
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteWord(userId: number, wordId: number) {
        // 验证单词属于当前用户
        const word = await this.prisma.word.findUnique({
            where: { id: wordId },
        });

        if (!word || word.userId !== userId) {
            throw new Error('单词不存在或无权删除');
        }

        return this.prisma.word.delete({
            where: { id: wordId },
        });
    }

    async getOxfordProgress(userId: number) {
        // 获取所有牛津词的文本 (去重)
        const oxfordWords = await this.prisma.oxfordWord.findMany({
            select: { text: true },
            distinct: ['text'],
        });

        const oxfordTexts = oxfordWords.map((w) => w.text);

        // 查询用户已掌握的牛津词数量
        const masteredCount = await this.prisma.word.count({
            where: {
                userId,
                text: { in: oxfordTexts },
            },
        });

        // 按等级统计
        const levelStats = await Promise.all(
            ['A1', 'A2', 'B1', 'B2'].map(async (level) => {
                const levelWords = await this.prisma.oxfordWord.findMany({
                    where: { level },
                    select: { text: true },
                    distinct: ['text'],
                });

                const levelTexts = levelWords.map((w) => w.text);

                const masteredInLevel = await this.prisma.word.count({
                    where: {
                        userId,
                        text: { in: levelTexts },
                    },
                });

                return {
                    level,
                    total: levelTexts.length,
                    mastered: masteredInLevel,
                    percentage: ((masteredInLevel / levelTexts.length) * 100).toFixed(1),
                };
            }),
        );

        return {
            total: oxfordTexts.length,
            mastered: masteredCount,
            percentage: ((masteredCount / oxfordTexts.length) * 100).toFixed(1),
            byLevel: levelStats,
        };
    }
}
