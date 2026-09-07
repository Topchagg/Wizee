import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubConceptDto {
  @IsString()
  @IsNotEmpty()
  conceptId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
