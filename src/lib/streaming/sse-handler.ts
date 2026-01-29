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
  console.log(`[EXTRACT] Starting text extraction with ${text.length} chars`);
  console.log(`[EXTRACT] First 200 chars: ${text.substring(0, 200)}`);

  // Pattern 1: Standard URLs (http/https)
  const urlRegex = /https?:\/\/[^\s<>"{}|\\\^`\[\]]+/gi;
  const urls = text.match(urlRegex) || [];
  console.log(`[EXTRACT] Pattern 1 (Standard URLs): Found ${urls.length} matches`);
  if (urls.length > 0) {
    console.log(`[EXTRACT]   URLs:`, urls.slice(0, 5).map(u => u.substring(0, 60)));
  }

  for (const url of urls) {
    // Skip malformed URLs (query strings, etc.)
    if (url.includes('%20')) {
      console.log(`[EXTRACT]   ✗ Skipping: contains %20`);
      continue;
    }
    if (url.length < 10) {
      console.log(`[EXTRACT]   ✗ Skipping: too short (${url.length})`);
      continue;
    }
    if (!url.includes('.')) {
      console.log(`[EXTRACT]   ✗ Skipping: no TLD`);
      continue;
    }

    // Extract snippet around URL (50 chars before/after)
    const urlIndex = text.indexOf(url);
    const start = Math.max(0, urlIndex - 50);
    const end = Math.min(text.length, urlIndex + url.length + 50);
    const snippet = text.substring(start, end).trim();

    try {
      const urlObj = new URL(url);
      console.log(`[EXTRACT]   ✓ Added URL: ${urlObj.hostname}`);
      evidence.push({
        url,
        snippet,
        domain: urlObj.hostname,
        role: 'believer', // Role determined by caller
      });
    } catch (e) {
      console.log(`[EXTRACT]   ✗ Failed to parse: ${url}`);
    }
  }

  // Pattern 1b: URLs in format [text](url) or (url)
  const bracketUrlRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/\S+/gi;
  let bracketMatch;
  const bracketUrls: string[] = [];
  while ((bracketMatch = bracketUrlRegex.exec(text)) !== null) {
    if (bracketMatch[2]) {
      // Format: [text](url)
      bracketUrls.push(bracketMatch[2]);
    }
  }
  console.log(`[EXTRACT] Pattern 1b (Bracket URLs): Found ${bracketUrls.length} additional matches`);
  for (const url of bracketUrls) {
    if (!urls.includes(url) && !url.includes('%20')) {
      try {
        const urlObj = new URL(url);
        evidence.push({
          url,
          snippet: `Found in reference`,
          domain: urlObj.hostname,
          role: 'believer',
        });
        console.log(`[EXTRACT]   ✓ Added bracket URL: ${urlObj.hostname}`);
      } catch (e) {
        console.log(`[EXTRACT]   ✗ Failed to parse bracket URL`);
      }
    }
  }

  // Pattern 2: Plain domain mentions (www.example.com without http://)
  const domainRegex = /(?:according to|from|at|via|see|check|visit|research from|study by|found at|published by|source:)\s+((?:www\.)?[a-z0-9-]+(?:\.[a-z]+)+)/gi;
  const domainMatches = [];
  let match;
  while ((match = domainRegex.exec(text)) !== null) {
    domainMatches.push(match[1]);
  }
  console.log(`[EXTRACT] Pattern 2 (Plain domains): Found ${domainMatches.length} matches`);
  if (domainMatches.length > 0) {
    console.log(`[EXTRACT]   Domains:`, domainMatches.slice(0, 5));
  }

  for (const domain of domainMatches) {
    // Convert domain mention to a searchable URL
    const url = `https://${domain.replace('www.', '')}`;
    const snippet = `Found at ${domain}`;

    // Only add if not already present
    if (!evidence.some((e) => e.url.includes(domain))) {
      console.log(`[EXTRACT]   ✓ Added domain: ${domain}`);
      evidence.push({ url, snippet, domain, role: 'believer' });
    }
  }

  // Pattern 3: Academic citations (Author et al., Year)
  const citationRegex = /\b([A-Z][a-z]+(?:\s+et\s+al\.|(?:\s*&\s*[A-Z][a-z]+)+),?\s+(?:19|20)\d{2})\b/g;
  const citations = text.match(citationRegex) || [];
  console.log(`[EXTRACT] Pattern 3 (Citations): Found ${citations.length} matches`);
  if (citations.length > 0) {
    console.log(`[EXTRACT]   Citations:`, citations.slice(0, 5));
  }

  for (const citation of citations) {
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(citation)}`;
    console.log(`[EXTRACT]   ✓ Added citation: ${citation}`);
    evidence.push({
      url,
      snippet: `Academic citation: ${citation}`,
      domain: 'scholar.google.com',
      role: 'believer',
    });
  }

  console.log(`[EXTRACT] ========== TOTAL EXTRACTED: ${evidence.length} items ==========`);
  if (evidence.length === 0) {
    console.log(`[EXTRACT] Text length: ${text.length}, Text contains http: ${text.includes('http')}, Contains .edu: ${text.includes('.edu')}`);
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
