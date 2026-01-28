export interface Evidence {
  id: string;
  source_url: string;
  domain: string;
  snippet: string;
  credibility_score: number;
  timestamp: Date;
  debate_id: string;
  mentioned_by: 'believer' | 'skeptic' | 'both';
}

export interface EvidenceSource {
  url: string;
  domain: string;
  credibility_score: number;
  title?: string;
  description?: string;
}

export interface CredibilityScore {
  domain: string;
  score: number; // 0-100
  factors: {
    domain_age?: number;
    https_enabled: boolean;
    fact_check_rating?: string;
    backlink_count?: number;
  };
}
