import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@warfire/shared";

@Roles(UserRole.ADMIN, UserRole.MASTER)
@Controller("logs")
export class LogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query("limit") limit?: string) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit, 10) : 100,
      include: { actor: { select: { name: true, login: true } } },
    });
  }
}
