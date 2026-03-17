const isDev = import.meta.env.DEV;

// In development, Vite proxies requests to the real APIs (see vite.config.ts)
const DEV_PREFIXES: Record<string, string> = {
  'https://query1.finance.yahoo.com': '/api/yahoo',
  'https://mayaapi.tase.co.il': '/api/maya',
  'https://boi.org.il': '/api/boi',
};

// In production, try these CORS proxies in order
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function proxiedFetch(url: string, retries = 2): Promise<Response> {
  // In dev mode, use Vite's built-in proxy — no CORS issues at all
  if (isDev) {
    for (const [origin, prefix] of Object.entries(DEV_PREFIXES)) {
      if (url.startsWith(origin)) {
        const localUrl = url.replace(origin, prefix);

        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const response = await fetchWithTimeout(localUrl);
            if (response.status === 429 && attempt < retries) {
              // Rate limited — wait and retry
              await delay(1000 * (attempt + 1));
              continue;
            }
            if (!response.ok) {
              throw new Error(`Dev proxy failed for ${url}: ${response.status}`);
            }
            return response;
          } catch (err) {
            if (attempt === retries) throw err;
            await delay(500 * (attempt + 1));
          }
        }
      }
    }
  }

  // Production: try each CORS proxy with fallback and retries
  const errors: string[] = [];
  for (const makeProxyUrl of CORS_PROXIES) {
    const proxiedUrl = makeProxyUrl(url);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(proxiedUrl);
        if (response.status === 429 && attempt < retries) {
          await delay(1000 * (attempt + 1));
          continue;
        }
        if (response.ok) return response;
        errors.push(`${response.status}`);
        break; // non-429 error, try next proxy
      } catch (err) {
        if (attempt === retries) {
          errors.push(err instanceof Error ? err.message : 'Unknown error');
        } else {
          await delay(500 * (attempt + 1));
        }
      }
    }
  }

  throw new Error(`All proxies failed for ${url}: ${errors.join(', ')}`);
}
