const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiFetchOptions = RequestInit & {
  accessToken?: string;
};

export async function apiFetch<T>(
  path: string,
  { accessToken, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const body = (await response.json()) as { message?: string | string[] };
      const rawMessage = body.message;
      message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
