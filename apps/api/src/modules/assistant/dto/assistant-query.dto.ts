import { IsString, MinLength } from "class-validator";

export class AssistantQueryDto {
  @IsString()
  @MinLength(2)
  question!: string;
}
