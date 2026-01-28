export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore?: number;
  publishedDate?: string;
}

export interface FactCheckResult {
  claim: string;
  claimant?: string;
  claimDate?: string;
  rating: string;
  ratingLevel?: number;
  url: string;
  publisher: string;
  textualRating?: string;
}

export interface ArchiveSnapshot {
  url: string;
  timestamp: string;
  status: number;
  available: boolean;
  archiveUrl?: string;
}

export interface DomainInfo {
  domain: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  ageInDays?: number;
  credibilityScore?: number;
  nameServers?: string[];
  error?: string;
}

export interface RateLimitInfo {
  toolName: string;
  remaining: number;
  resetAt: Date;
  limited: boolean;
}

export interface ToolResponse<T> {
  data: T;
  cached: boolean;
  rateLimit: RateLimitInfo;
  error?: string;
}

export interface VerificationTools {
  braveSearch: (query: string) => Promise<ToolResponse<SearchResult[]>>;
  factCheck: (claim: string) => Promise<ToolResponse<FactCheckResult[]>>;
  archive: (url: string, timestamp?: string) => Promise<ToolResponse<ArchiveSnapshot[]>>;
  whois: (domain: string) => Promise<ToolResponse<DomainInfo>>;
}
