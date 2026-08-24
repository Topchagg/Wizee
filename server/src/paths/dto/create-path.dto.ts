import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePathDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
