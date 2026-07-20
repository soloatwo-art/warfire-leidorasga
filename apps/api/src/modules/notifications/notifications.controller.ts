import { Controller, Get, Patch, Param } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list() {
    return this.notifications.list();
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.notifications.markRead(id);
  }

  @Patch("read-all")
  markAllRead() {
    return this.notifications.markAllRead();
  }
}
