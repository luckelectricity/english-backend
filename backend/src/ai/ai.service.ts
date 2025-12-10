import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly openai: OpenAI;

    constructor(private configService: ConfigService) {
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
}
