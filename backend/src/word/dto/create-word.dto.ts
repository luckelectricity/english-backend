import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateWordDto {
    @IsString()
    text: string;

    @IsString()
    sentence: string;

    @IsString()
    meaning: string;

    @IsOptional()
    @IsUrl()
    sourceUrl?: string;
}
