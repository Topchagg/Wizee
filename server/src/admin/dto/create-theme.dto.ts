import { IsNotEmpty, IsString } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
