import { FetchError } from "ofetch";

export function toApiErrorMessage(error: unknown): string {
  if (!(error instanceof FetchError) || !error.response)
    return "Сервис недоступен";
  if (error.response.status === 400) return "Проверьте заполненные поля";
  if (error.response.status === 404) return "Анализ не найден";
  return "Сервис ответил ошибкой";
}
