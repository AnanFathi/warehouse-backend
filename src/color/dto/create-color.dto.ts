import { IsString, Matches, MinLength } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'Invalid hex color value' })
  color: string;
}
