import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RubinotScraperService } from "../scraper/rubinot-scraper.service";
import { AddCharacterDto } from "./dto/add-character.dto";
import { ActivityLevel, CharacterProfileDto, MarkerTag } from "@warfire/shared";
import { computeActivity } from "../activity/activity.util";

@Injectable()
export class CharactersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: RubinotScraperService,
  ) {}

  async listMine(userId: string) {
    return this.prisma.character.findMany({ where: { userId } });
  }

  async addSecondary(userId: string, dto: AddCharacterDto) {
    const existing = await this.prisma.character.findUnique({ where: { name: dto.name } });
    if (existing?.userId && existing.userId !== userId) {
      throw new ConflictException("Este personagem já está vinculado a outro usuário.");
    }

    return this.prisma.character.upsert({
      where: { name: dto.name },
      update: { userId, world: dto.world, markerTag: dto.markerTag },
      create: {
        name: dto.name,
        world: dto.world,
        markerTag: dto.markerTag,
        isPrincipal: false,
        userId,
      },
    });
  }

  async updateMarker(userId: string, characterId: string, markerTag: MarkerTag) {
    const character = await this.assertOwnership(userId, characterId);
    return this.prisma.character.update({ where: { id: character.id }, data: { markerTag } });
  }

  async remove(userId: string, characterId: string) {
    const character = await this.assertOwnership(userId, characterId);
    if (character.isPrincipal) {
      throw new ForbiddenException("Não é possível remover o personagem principal.");
    }
    await this.prisma.character.delete({ where: { id: character.id } });
  }

  private async assertOwnership(userId: string, characterId: string) {
    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) throw new NotFoundException("Personagem não encontrado.");
    if (character.userId !== userId) throw new ForbiddenException("Este personagem não é seu.");
    return character;
  }

  async getProfile(name: string): Promise<CharacterProfileDto> {
    const parsed = await this.scraper.fetchCharacterPage(name);
    const existing = await this.prisma.character.findUnique({ where: { name } });

    if (!parsed) {
      if (!existing) throw new NotFoundException("Personagem não encontrado no RubinOT.");
      return this.buildProfileFromCache(existing);
    }

    const character = await this.prisma.character.upsert({
      where: { name },
      update: {
        vocation: parsed.vocation,
        level: parsed.level,
        world: parsed.world ?? existing?.world ?? "",
        residence: parsed.residence,
        guildName: parsed.guildName,
        guildRank: parsed.guildRank,
        lastLoginAt: parsed.lastLoginAt,
        loyaltyTitle: parsed.loyaltyTitle,
        achievementPoints: parsed.achievementPoints,
        lastSyncedAt: new Date(),
      },
      create: {
        name,
        vocation: parsed.vocation,
        level: parsed.level,
        world: parsed.world ?? "",
        residence: parsed.residence,
        guildName: parsed.guildName,
        guildRank: parsed.guildRank,
        lastLoginAt: parsed.lastLoginAt,
        loyaltyTitle: parsed.loyaltyTitle,
        achievementPoints: parsed.achievementPoints,
        lastSyncedAt: new Date(),
        markerTag: MarkerTag.MARKER,
      },
    });

    if (parsed.level !== null) {
      const [lastRecorded] = await this.prisma.levelHistory.findMany({
        where: { characterName: name },
        orderBy: { recordedAt: "desc" },
        take: 1,
      });
      if (!lastRecorded || lastRecorded.level !== parsed.level) {
        await this.prisma.levelHistory.create({ data: { characterName: name, level: parsed.level } });
      }
    }

    if (parsed.deaths.length > 0) {
      await this.prisma.death.createMany({
        data: parsed.deaths.map((d) => ({
          characterName: name,
          level: d.level,
          killer: d.killer,
          mostDamageBy: d.mostDamageBy,
          world: parsed.world,
          occurredAt: d.occurredAt,
        })),
        skipDuplicates: true,
      });
    }

    return this.buildProfileFromCache(character, parsed.alternateCharacters);
  }

  private async buildProfileFromCache(
    character: {
      name: string;
      vocation: string | null;
      level: number | null;
      world: string;
      residence: string | null;
      guildName: string | null;
      guildRank: string | null;
      lastLoginAt: Date | null;
      loyaltyTitle: string | null;
      achievementPoints: number | null;
      markerTag: MarkerTag;
      isPrincipal: boolean;
    },
    alternates: { name: string; vocation: string; level: number; world: string }[] = [],
  ): Promise<CharacterProfileDto> {
    const [levelHistory, deaths, guildMember] = await Promise.all([
      this.prisma.levelHistory.findMany({
        where: { characterName: character.name },
        orderBy: { recordedAt: "asc" },
        take: 60,
      }),
      this.prisma.death.findMany({
        where: { characterName: character.name },
        orderBy: { occurredAt: "desc" },
        take: 20,
      }),
      this.prisma.guildMember.findUnique({ where: { characterName: character.name } }),
    ]);

    const activity = computeActivity(
      guildMember?.lastSeenOnlineAt ?? null,
      guildMember?.lastLevelUpAt ?? character.lastLoginAt ?? null,
    );

    return {
      name: character.name,
      vocation: character.vocation,
      level: character.level,
      world: character.world,
      residence: character.residence,
      guildName: character.guildName,
      guildRank: character.guildRank,
      lastLoginAt: character.lastLoginAt?.toISOString() ?? null,
      loyaltyTitle: character.loyaltyTitle,
      achievementPoints: character.achievementPoints,
      markerTag: character.markerTag,
      isPrincipal: character.isPrincipal,
      activityLevel: activity.level as ActivityLevel,
      levelHistory: levelHistory.map((l) => ({ level: l.level, recordedAt: l.recordedAt.toISOString() })),
      deaths: deaths.map((d) => ({ level: d.level, killer: d.killer, occurredAt: d.occurredAt.toISOString() })),
      alternateCharacters: alternates,
    };
  }
}
