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

  private async scoreCredibility(domain: string, url: string): Promise<number> {
    if (this.credibilityCache.has(domain)) {
      return this.credibilityCache.get(domain)!;
    }

    // Calculate score based on domain characteristics
    let ageScore = this.calculateAgeScore(domain);
    let reputationScore = this.calculateReputationScore(domain);

    const totalScore = Math.min(100, Math.round(ageScore * 0.4 + reputationScore * 0.6));
    this.credibilityCache.set(domain, totalScore);

    return totalScore;
  }

  private calculateAgeScore(domain: string): number {
    // Simplified age scoring - in production would use WHOIS data
    if (domain.includes('.edu')) return 40;
    if (domain.includes('.gov')) return 38;

    // Default domain age assumptions
    const knownOldDomains = ['wikipedia.org', 'bbc.com', 'reuters.com', 'apnews.com'];
    if (knownOldDomains.some((known) => domain.includes(known))) {
      return 35;
    }

    return 20; // Default for unknown domains
  }

  private calculateReputationScore(domain: string): number {
    // Score based on domain characteristics
    const academicDomains = ['.edu', '.ac.uk', '.ac.jp', 'scholar.', 'research.', 'ieee.', 'arxiv.'];
    const newsDomains = [
      'bbc.com',
      'reuters.com',
      'apnews.com',
      'bbc.co.uk',
      'theguardian.com',
      'nytimes.com',
      'washingtonpost.com',
    ];
    const governmentDomains = ['.gov', '.gov.uk', '.edu', '.mil'];

    if (academicDomains.some((pattern) => domain.includes(pattern))) return 60;
    if (governmentDomains.some((pattern) => domain.includes(pattern))) return 55;
    if (newsDomains.some((pattern) => domain.includes(pattern))) return 45;
    if (domain.includes('blog') || domain.includes('medium.com')) return 10;

    return 25; // Neutral default
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
