import { Body, Controller, Post } from "@nestjs/common";
import { AssistantService } from "./assistant.service";
import { AssistantQueryDto } from "./dto/assistant-query.dto";

@Controller("assistant")
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post("ask")
  ask(@Body() dto: AssistantQueryDto) {
    return this.assistant.ask(dto.question);
  }
}
