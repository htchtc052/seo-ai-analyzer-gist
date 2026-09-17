import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  type ExceptionFilter,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

type ErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string[]>;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(HttpAdapterHost)
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.adapterHost.httpAdapter.reply(
      response,
      { error: toErrorBody(exception, status) },
      status,
    );
  }
}

function toErrorBody(exception: unknown, status: number): ErrorBody {
  const fallbackCode =
    status === HttpStatus.INTERNAL_SERVER_ERROR
      ? "INTERNAL_ERROR"
      : `HTTP_${status}`;

  if (!(exception instanceof HttpException)) {
    return { code: fallbackCode, message: "Unexpected server error" };
  }

  const details = exception.getResponse() as ErrorBody;
  return {
    code: details.code ?? fallbackCode,
    message: details.message ?? "Unexpected server error",
    ...(details.fields ? { fields: details.fields } : {}),
  };
}
