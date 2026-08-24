import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'FILL_GAP',
  'CALCULATION',
  'CODE_CHALLENGE',
] as const;

export class TaskDto {
  @IsIn(QUESTION_TYPES)
  type: (typeof QUESTION_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  choices?: unknown;

  @IsNotEmpty()
  answer: unknown;

  // false (default): a normal HW task — what the Test step starts on. true:
  // a duplicate of a task actually solved in the video — never the step's
  // starting task, only reachable by rolling when stuck on an HW task.
  @IsOptional()
  @IsBoolean()
  isSolvedOnScreen?: boolean;
}
