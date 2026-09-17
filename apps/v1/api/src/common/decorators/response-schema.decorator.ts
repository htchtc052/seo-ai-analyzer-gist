import { SetMetadata } from "@nestjs/common";
import type { ZodType } from "zod";

export const RESPONSE_SCHEMA = "RESPONSE_SCHEMA";

export const ResponseSchema = (schema: ZodType) =>
  SetMetadata(RESPONSE_SCHEMA, schema);
