import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationDto } from "@warfire/shared";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 50): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  }
}
