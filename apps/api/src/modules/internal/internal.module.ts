import { Module } from "@nestjs/common";
import { GuildModule } from "../guild/guild.module";
import { WorldsModule } from "../worlds/worlds.module";
import { InternalController } from "./internal.controller";

@Module({
  imports: [GuildModule, WorldsModule],
  controllers: [InternalController],
})
export class InternalModule {}
