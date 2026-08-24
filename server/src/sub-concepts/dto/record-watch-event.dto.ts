import { IsBoolean, IsInt, IsString, Min } from 'class-validator';

export class RecordWatchEventDto {
  @IsString()
  contentId: string;

  @IsInt()
  @Min(0)
  watchedSeconds: number;

  @IsBoolean()
  completed: boolean;
}
