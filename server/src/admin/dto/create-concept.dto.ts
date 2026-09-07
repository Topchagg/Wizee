import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConceptDto {
  @IsString()
  @IsNotEmpty()
  themeId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
