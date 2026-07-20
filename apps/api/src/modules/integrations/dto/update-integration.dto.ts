import { IsBoolean, IsObject, IsOptional } from "class-validator";

export class UpdateIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsObject()
  config!: Record<string, unknown>;
}
