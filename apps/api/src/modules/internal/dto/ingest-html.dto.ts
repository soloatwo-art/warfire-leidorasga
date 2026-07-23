import { IsString, MinLength } from "class-validator";

export class IngestHtmlDto {
  @IsString()
  @MinLength(50)
  html!: string;
}
