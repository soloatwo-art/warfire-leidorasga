import { Injectable } from "@nestjs/common";
import { Prisma } from "@warfire/database";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UpdateIntegrationDto } from "./dto/update-integration.dto";

export type IntegrationKey = "TEAMSPEAK" | "X3T_BOT";

/**
 * TeamSpeak (ServerQuery) and x3tBot integrations are out of MVP scope — we
 * have no credentials or API docs for either yet. This service only persists
 * the admin-entered connection settings and always reports "disconnected",
 * so the panel UI and data model are ready the moment real credentials show
 * up, without needing schema or API changes.
 */
@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const configs = await this.prisma.integrationConfig.findMany();
    return (["TEAMSPEAK", "X3T_BOT"] as IntegrationKey[]).map((key) => {
      const existing = configs.find((c) => c.key === key);
      return this.toStatusPayload(key, existing);
    });
  }

  async get(key: IntegrationKey) {
    const existing = await this.prisma.integrationConfig.findUnique({ where: { key } });
    return this.toStatusPayload(key, existing);
  }

  async update(key: IntegrationKey, dto: UpdateIntegrationDto) {
    const config = dto.config as unknown as Prisma.InputJsonValue;
    const saved = await this.prisma.integrationConfig.upsert({
      where: { key },
      update: { enabled: dto.enabled ?? false, config },
      create: { key, enabled: dto.enabled ?? false, config },
    });
    return this.toStatusPayload(key, saved);
  }

  private toStatusPayload(
    key: IntegrationKey,
    record: { enabled: boolean; config: unknown; updatedAt: Date } | null | undefined,
  ) {
    return {
      key,
      enabled: record?.enabled ?? false,
      configured: !!record,
      // Always disconnected: no real client is implemented yet.
      status: "not_implemented" as const,
      updatedAt: record?.updatedAt?.toISOString() ?? null,
    };
  }
}
