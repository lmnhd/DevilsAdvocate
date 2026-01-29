export interface TrackedEvidence {
  id: string;
  url: string;
  domain: string;
  snippet: string;
  credibility_score: number;
  mentioned_by: 'believer' | 'skeptic' | 'both';
  first_mentioned_at: Date;
  source_type: 'academic' | 'news' | 'government' | 'social' | 'unknown';
}

export class EvidenceTracker {
  private evidenceMap: Map<string, TrackedEvidence>;
  private credibilityCache: Map<string, number>;

  constructor() {
    this.evidenceMap = new Map();
    this.credibilityCache = new Map();
  }

  async trackEvidence(
    url: string,
    snippet: string,
    role: 'believer' | 'skeptic'
  ): Promise<TrackedEvidence> {
    // VALIDATE URL FORMAT
    if (!this.isValidUrl(url)) {
      console.warn(`[EVIDENCE] Skipping invalid URL: ${url.substring(0, 50)}`);
      throw new Error('Invalid URL format');
    }

    const existing = this.evidenceMap.get(url);

    if (existing) {
      existing.mentioned_by = 'both';
      return existing;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname || 'unknown';
      const credibilityScore = await this.scoreCredibility(domain, url);
      const sourceType = this.categorizeSource(domain);

      const evidence: TrackedEvidence = {
        id: `${role}-${this.evidenceMap.size}`,
        url,
        domain,
        snippet,
        credibility_score: credibilityScore,
        mentioned_by: role,
        first_mentioned_at: new Date(),
        source_type: sourceType,
      };

      this.evidenceMap.set(url, evidence);
      return evidence;
    } catch {
      return {
        id: `${role}-${this.evidenceMap.size}`,
        url,
        domain: 'unknown',
        snippet,
        credibility_score: 25,
        mentioned_by: role,
        first_mentioned_at: new Date(),
        source_type: 'unknown',
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      // Must be valid URL
      const urlObj = new URL(url);

      // Must have http/https protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Must have valid hostname with TLD
      if (!urlObj.hostname.includes('.')) {
        return false;
      }

      // Must not be URL-encoded query string
      if (url.includes('%20') || url.includes('%2F')) {
        return false;
      }

      // Must be reasonable length
      if (url.length < 10 || url.length > 500) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async scoreCredibility(domain: string, url: string): Promise<number> {
    if (this.credibilityCache.has(domain)) {
      return this.credibilityCache.get(domain)!;
    }

    // Use reputation score only (age scoring was unreliable)
    const reputationScore = this.calculateReputationScore(domain);
    const totalScore = Math.min(100, Math.round(reputationScore));

    this.credibilityCache.set(domain, totalScore);

    return totalScore;
  }

  private calculateAgeScore(domain: string): number {
    // Age scoring removed - reputation is more reliable
    return 0;
  }

  private calculateReputationScore(domain: string): number {
    // TIER 1: Academic & Government (85-95%)
    const tier1Domains = [
      '.edu',
      '.ac.uk',
      '.ac.jp',
      '.gov',
      '.gov.uk',
      'scholar.google',
      'ieee.org',
      'arxiv.org',
      'nih.gov',
      'cdc.gov',
      'nasa.gov',
      'universityconsortium.edu',
    ];
    if (tier1Domains.some((d) => domain.includes(d))) {
      return 90; // High credibility for academic/government
    }

    // TIER 2: Major News Organizations (75-85%)
    const tier2Domains = [
      'nytimes.com',
      'reuters.com',
      'apnews.com',
      'bbc.com',
      'bbc.co.uk',
      'wsj.com',
      'economist.com',
      'ft.com',
      'theguardian.com',
      'washingtonpost.com',
      'npr.org',
      'pbs.org',
    ];
    if (tier2Domains.some((d) => domain.includes(d))) {
      return 80; // High-quality journalism
    }

    // TIER 3: Business & Tech Publications (65-75%)
    const tier3Domains = [
      'forbes.com',
      'bloomberg.com',
      'techcrunch.com',
      'wired.com',
      'arstechnica.com',
      'technologyreview.com',
      'scientificamerican.com',
      'nature.com',
      'science.org',
      'pnas.org',
    ];
    if (tier3Domains.some((d) => domain.includes(d))) {
      return 70; // Reputable business/tech sources
    }

    // TIER 4: Known Databases & Reference Sites (60-70%)
    const tier4Domains = [
      'wikipedia.org',
      'britannica.com',
      'jstor.org',
      'pubmed.gov',
      'researchgate.net',
      'academia.edu',
      'sciencedirect.com',
    ];
    if (tier4Domains.some((d) => domain.includes(d))) {
      return 65; // Reference materials
    }

    // TIER 5: Established Web Publishers (50-60%)
    const tier5Domains = [
      'medium.com',
      'substack.com',
      'stackoverflow.com',
      'github.com',
      'youtube.com',
      'vimeo.com',
      'ted.com',
    ];
    if (tier5Domains.some((d) => domain.includes(d))) {
      return 55; // User-generated but established platforms
    }

    // TIER 6: Social Media & Low Credibility (20-40%)
    const tier6Domains = [
      'reddit.com',
      'twitter.com',
      'x.com',
      'facebook.com',
      'instagram.com',
      'tiktok.com',
      'quora.com',
      'yahoo.com',
    ];
    if (tier6Domains.some((d) => domain.includes(d))) {
      return 30; // Social media - low baseline credibility
    }

    // DEFAULT: Unknown domains (40-50%)
    return 45;
  }

  private categorizeSource(domain: string): 'academic' | 'news' | 'government' | 'social' | 'unknown' {
    if (domain.includes('.edu') || domain.includes('scholar') || domain.includes('research')) {
      return 'academic';
    }
    if (
      domain.includes('.gov') ||
      domain.includes('whitehouse') ||
      domain.includes('parliament') ||
      domain.includes('senate')
    ) {
      return 'government';
    }
    if (
      domain.includes('facebook') ||
      domain.includes('twitter') ||
      domain.includes('reddit') ||
      domain.includes('tiktok') ||
      domain.includes('instagram')
    ) {
      return 'social';
    }
    if (
      domain.includes('news') ||
      domain.includes('bbc') ||
      domain.includes('reuters') ||
      domain.includes('ap') ||
      domain.includes('bbc.com')
    ) {
      return 'news';
    }

    return 'unknown';
  }

  getTopEvidence(limit: number = 10): TrackedEvidence[] {
    return Array.from(this.evidenceMap.values())
      .sort((a, b) => b.credibility_score - a.credibility_score)
      .slice(0, limit);
  }

  getEvidenceByRole(role: 'believer' | 'skeptic'): TrackedEvidence[] {
    return Array.from(this.evidenceMap.values()).filter(
      (e) => e.mentioned_by === role || e.mentioned_by === 'both'
    );
  }

  getAllEvidence(): TrackedEvidence[] {
    return Array.from(this.evidenceMap.values());
  }

  clearEvidence(): void {
    this.evidenceMap.clear();
    this.credibilityCache.clear();
  }
}
