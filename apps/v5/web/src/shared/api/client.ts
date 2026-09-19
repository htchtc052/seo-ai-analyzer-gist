export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok)
    throw new Error(`Сервис ответил ошибкой ${response.status}`);
  return (await response.json()) as T;
}
