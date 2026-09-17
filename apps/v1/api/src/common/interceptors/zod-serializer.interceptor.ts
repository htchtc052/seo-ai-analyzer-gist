import {
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, type Observable } from "rxjs";
import type { ZodType } from "zod";
import { RESPONSE_SCHEMA } from "../decorators/response-schema.decorator.js";

@Injectable()
export class ZodSerializerInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const schema = this.reflector.get<ZodType | undefined>(
      RESPONSE_SCHEMA,
      context.getHandler(),
    );
    if (!schema) return next.handle();

    return next.handle().pipe(map((payload) => schema.parse(payload)));
  }
}
