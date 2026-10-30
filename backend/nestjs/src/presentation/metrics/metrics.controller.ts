// GET /metrics — экспорт Prometheus (text/plain). @Res обходит сериализацию Nest.
import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { registry } from "./metrics";

@Controller()
export class MetricsController {
  @Get("metrics")
  async metrics(@Res() res: Response): Promise<void> {
    res.type(registry.contentType).end(await registry.metrics());
  }
}
