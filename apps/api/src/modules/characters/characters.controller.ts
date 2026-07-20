import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CharactersService } from "./characters.service";
import { AddCharacterDto, UpdateMarkerDto } from "./dto/add-character.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";

@Controller("characters")
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get("mine")
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.charactersService.listMine(user.id);
  }

  @Post()
  async add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCharacterDto) {
    return this.charactersService.addSecondary(user.id, dto);
  }

  @Patch(":id/marker")
  async updateMarker(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateMarkerDto,
  ) {
    return this.charactersService.updateMarker(user.id, id, dto.markerTag);
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.charactersService.remove(user.id, id);
    return { message: "Personagem removido." };
  }

  @Public()
  @Get(":name/profile")
  async profile(@Param("name") name: string) {
    return this.charactersService.getProfile(decodeURIComponent(name));
  }
}
