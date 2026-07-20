import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { MarkerTag } from "@warfire/shared";

export class AddCharacterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  world!: string;

  @IsEnum(MarkerTag)
  markerTag!: MarkerTag;
}

export class UpdateMarkerDto {
  @IsEnum(MarkerTag)
  markerTag!: MarkerTag;
}

export class UpdatePrincipalDto {
  @IsOptional()
  isPrincipal?: boolean;
}
