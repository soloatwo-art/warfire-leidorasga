import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import configuration from "./common/config/configuration";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { GuildModule } from "./modules/guild/guild.module";
import { CharactersModule } from "./modules/characters/characters.module";
import { StatsModule } from "./modules/stats/stats.module";
import { WorldsModule } from "./modules/worlds/worlds.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { LogsModule } from "./modules/logs/logs.module";
import { InternalModule } from "./modules/internal/internal.module";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    RedisModule,
    RealtimeModule,
    AuthModule,
    GuildModule,
    CharactersModule,
    StatsModule,
    WorldsModule,
    NotificationsModule,
    AssistantModule,
    IntegrationsModule,
    LogsModule,
    InternalModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
