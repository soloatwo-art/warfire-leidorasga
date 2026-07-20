import { Module } from "@nestjs/common";
import { StatsModule } from "../stats/stats.module";
import { AssistantService } from "./assistant.service";
import { AssistantController } from "./assistant.controller";

@Module({
  imports: [StatsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
