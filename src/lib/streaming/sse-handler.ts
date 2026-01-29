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

export function extractEvidenceFromToken(token: string): Evidence[] {
  const urlRegex = /https?:\/\/[^\s\],"'<>]+/g;
  const matches = token.match(urlRegex) || [];

  return matches.map((url) => {
    try {
      const urlObj = new URL(url);
      return {
        url,
        snippet: token.substring(Math.max(0, token.indexOf(url) - 50), token.indexOf(url) + url.length + 50),
        domain: urlObj.hostname,
        role: 'believer', // Role determined by caller
      };
    } catch {
      return {
        url,
        snippet: token.substring(Math.max(0, token.indexOf(url) - 50), token.indexOf(url) + url.length + 50),
        domain: 'unknown',
        role: 'believer',
      };
    }
  });
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
