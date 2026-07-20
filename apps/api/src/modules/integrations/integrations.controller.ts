import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { IntegrationsService, IntegrationKey } from "./integrations.service";
import { UpdateIntegrationDto } from "./dto/update-integration.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@warfire/shared";

@Roles(UserRole.ADMIN, UserRole.MASTER)
@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  list() {
    return this.integrations.list();
  }

  @Get(":key")
  get(@Param("key") key: IntegrationKey) {
    return this.integrations.get(key);
  }

  @Put(":key")
  update(@Param("key") key: IntegrationKey, @Body() dto: UpdateIntegrationDto) {
    return this.integrations.update(key, dto);
  }
}
