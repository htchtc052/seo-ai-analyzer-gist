import { Module } from "@nestjs/common";
import { SelectionClientService } from "./services/selection-client.service.js";

@Module({
  providers: [SelectionClientService],
  exports: [SelectionClientService],
})
export class SelectionModule {}
