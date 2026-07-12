const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const REQUEST_TIMEOUT_MS = 6000;

type WikipediaPages = Record<
  string,
  {
    thumbnail?: {
      source?: string;
    };
  }
>;

export async function fetchItemImageUrl(query: string): Promise<string | undefined> {
  const trimmed = query.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidates = [trimmed, trimmed.split(/\s+/).slice(0, 4).join(' ')];

  for (const candidate of candidates) {
    const imageUrl = await fetchWikipediaThumbnail(candidate);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
}

async function fetchWikipediaThumbnail(searchTerm: string): Promise<string | undefined> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: searchTerm,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '960',
    format: 'json',
    origin: '*',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${WIKIPEDIA_API}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as { query?: { pages?: WikipediaPages } };
    const pages = payload.query?.pages;
    if (!pages) {
      return undefined;
    }

    const firstPage = Object.values(pages)[0];
    return firstPage?.thumbnail?.source;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
