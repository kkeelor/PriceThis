export function parseApiErrorBody(text: string, status: number): string {
  const trimmed = text.trim();

  if (!trimmed) {
    return `Request failed with status ${status}`;
  }

  if (status === 404) {
    return 'API not found. The server may not be deployed correctly yet.';
  }

  try {
    const errorBody = JSON.parse(trimmed) as {
      error?: unknown;
      message?: unknown;
    };

    if (typeof errorBody.message === 'string') {
      return errorBody.message;
    }

    if (typeof errorBody.error === 'string') {
      return errorBody.error;
    }

    if (errorBody.error && typeof errorBody.error === 'object') {
      const nested = errorBody.error as { message?: unknown };
      if (typeof nested.message === 'string') {
        return nested.message;
      }
    }
  } catch {
    // fall through to raw text
  }

  return trimmed;
}
