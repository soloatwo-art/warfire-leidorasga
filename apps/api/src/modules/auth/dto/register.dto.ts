import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MarkerTag } from "@warfire/shared";

export class CharacterInputDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  world!: string;

  @IsEnum(MarkerTag)
  markerTag!: MarkerTag;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  discordTag?: string;

  @IsString()
  @MinLength(3)
  login!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  mainCharacterName!: string;

  @IsString()
  @MinLength(2)
  world!: string;

  @IsBoolean()
  isMainMarker!: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CharacterInputDto)
  @ArrayMaxSize(20)
  secondaryCharacters?: CharacterInputDto[];
}
