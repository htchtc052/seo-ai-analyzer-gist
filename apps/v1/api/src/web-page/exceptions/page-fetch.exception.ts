import { UnprocessableEntityException } from "@nestjs/common";

export class PageFetchException extends UnprocessableEntityException {
  constructor(message: string) {
    super({ code: "PAGE_FETCH_FAILED", message });
  }
}
