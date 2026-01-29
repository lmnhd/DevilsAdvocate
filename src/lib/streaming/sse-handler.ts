export interface SSEEvent {
  event: string;
  data: Record<string, any>;
}

export function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export interface Evidence {
  url: string;
  snippet: string;
  role: 'believer' | 'skeptic';
  domain?: string;
}

export function extractEvidenceFromToken(text: string): Evidence[] {
  const evidence: Evidence[] = [];

  // Pattern 1: Standard URLs (http/https)
  const urlRegex = /https?:\/\/[^\s<>"{}|\\\^`\[\]]+/gi;
  const urls = text.match(urlRegex) || [];

  for (const url of urls) {
    // Skip malformed URLs (query strings, etc.)
    if (url.includes('%20') || url.length < 10) continue;
    if (!url.includes('.')) continue; // Must have a TLD

    // Extract snippet around URL (50 chars before/after)
    const urlIndex = text.indexOf(url);
    const start = Math.max(0, urlIndex - 50);
    const end = Math.min(text.length, urlIndex + url.length + 50);
    const snippet = text.substring(start, end).trim();

    try {
      const urlObj = new URL(url);
      evidence.push({
        url,
        snippet,
        domain: urlObj.hostname,
        role: 'believer', // Role determined by caller
      });
    } catch {
      // Skip URLs that fail to parse
    }
  }

  // Pattern 2: Domain mentions (for when LLM cites sources without full URL)
  const domainMentionRegex = /(?:according to|study by|research from|data from|report by)\s+([a-z0-9-]+(?:\.[a-z]+)+)/gi;
  let match;
  while ((match = domainMentionRegex.exec(text)) !== null) {
    const domain = match[1];
    const fullMatch = match[0];

    // Convert domain mention to a searchable URL
    const url = `https://${domain}`;
    const snippet = fullMatch;

    // Only add if not already present
    if (!evidence.some((e) => e.url.includes(domain))) {
      evidence.push({ url, snippet, domain, role: 'believer' });
    }
  }

  // Pattern 3: Academic citations (Author et al., Year)
  const citationRegex = /([A-Z][a-z]+(?:\s+(?:et al\.|& [A-Z][a-z]+))?,?\s+(?:19|20)\d{2})/g;
  const citations = text.match(citationRegex) || [];

  for (const citation of citations) {
    // Create a pseudo-URL for academic citations
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(citation)}`;
    evidence.push({
      url,
      snippet: `Academic citation: ${citation}`,
      domain: 'scholar.google.com',
      role: 'believer',
    });
  }

  return evidence;
}

export async function* mergeAsyncGenerators<T>(
  gen1: AsyncIterable<T>,
  gen2: AsyncIterable<T>
): AsyncGenerator<T & { source: number }> {
  const queue: (T & { source: number })[] = [];
  let gen1Done = false;
  let gen2Done = false;

  const iterator1 = gen1[Symbol.asyncIterator]();
  const iterator2 = gen2[Symbol.asyncIterator]();

  const pushFromGen1 = async () => {
    const result = await iterator1.next();
    if (!result.done) {
      queue.push({ ...result.value, source: 1 });
      pushFromGen1();
    } else {
      gen1Done = true;
    }
  };

  const pushFromGen2 = async () => {
    const result = await iterator2.next();
    if (!result.done) {
      queue.push({ ...result.value, source: 2 });
      pushFromGen2();
    } else {
      gen2Done = true;
    }
  };

  pushFromGen1();
  pushFromGen2();

  while (!gen1Done || !gen2Done || queue.length > 0) {
    if (queue.length > 0) {
      yield queue.shift()!;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}
