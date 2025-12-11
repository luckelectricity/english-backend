import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly openai: OpenAI;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.openai = new OpenAI({
            apiKey: this.configService.get('DEEPSEEK_API_KEY'),
            baseURL: this.configService.get('DEEPSEEK_API_URL'),
        });
    }

    async analyzeWord(word: string, sentence: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.configService.get('DEEPSEEK_MODEL') || 'deepseek-v3-250324',
                messages: [
                    {
                        role: 'system',
                        content:
                            '你是一个英语词汇分析专家。根据给定的句子,分析单词的准确含义。只返回中文释义,不要有其他解释。',
                    },
                    {
                        role: 'user',
                        content: `句子: "${sentence}"\n单词: "${word}"\n请用中文解释这个单词在此语境下的含义。`,
                    },
                ],
                temperature: 0.3,
            });

            const meaning = response.choices[0]?.message?.content?.trim();

            if (!meaning) {
                throw new Error('AI 返回空结果');
            }

            this.logger.log(`AI 分析成功: ${word} -> ${meaning}`);
            return meaning;
        } catch (error) {
            this.logger.error(`AI 分析失败: ${error.message}`);
            throw new Error('AI 分析失败,请稍后重试');
        }
    }

    async expandTutor(word: string, contextSentence: string, contextId?: number): Promise<any> {
        // 1. 尝试读取缓存
        if (contextId) {
            const context = await this.prisma.context.findUnique({
                where: { id: contextId },
                select: { aiExplanation: true }
            });
            if (context?.aiExplanation) {
                this.logger.log(`命中 AI 缓存: ContextID ${contextId}`);
                try {
                    return JSON.parse(context.aiExplanation);
                } catch (e) {
                    this.logger.warn(`缓存 JSON 解析失败，重新生成: ${e.message}`);
                }
            }
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: this.configService.get('DEEPSEEK_MODEL') || 'deepseek-v3-250324',
                messages: [
                    {
                        role: 'system',
                        content: `你是一个专业的英语私教。请根据用户提供的单词和上下文句子，提供详细的中文讲解和额外的例句。
必须返回严格的 JSON 格式，不要包含 markdown 代码块标记。
JSON 格式如下：
{
  "explanation": "中文讲解，包括在此语境下的含义、用法搭配等",
  "examples": [
    { "sentence": "英文例句1", "translation": "中文翻译1" },
    { "sentence": "英文例句2", "translation": "中文翻译2" },
    { "sentence": "英文例句3", "translation": "中文翻译3" }
  ]
}`
                    },
                    {
                        role: 'user',
                        content: `单词: "${word}"\n上下文句子: "${contextSentence}"`
                    }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content?.trim();
            if (!content) {
                throw new Error('AI 返回空结果');
            }

            // 2. 写入缓存
            if (contextId) {
                await this.prisma.context.update({
                    where: { id: contextId },
                    data: { aiExplanation: content }
                }).catch(err => {
                    this.logger.error(`写入 AI 缓存失败: ${err.message}`);
                });
            }

            return JSON.parse(content);
        } catch (error) {
            this.logger.error(`AI 拓展失败: ${error.message}`);
            throw new Error('获取 AI 详解失败');
        }
    }
}
