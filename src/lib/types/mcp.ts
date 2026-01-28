export type MCPToolType = 'brave_search' | 'fact_check' | 'archive' | 'whois';

export interface MCPTool {
  name: MCPToolType;
  rateLimit: {
    maxRequests: number;
    period: 'hour' | 'day' | 'month';
  };
  timeout: number; // milliseconds
}

export interface MCPResult {
  tool: MCPToolType;
  success: boolean;
  data?: unknown;
  error?: string;
  cached: boolean;
  timestamp: Date;
}

export interface VerificationTools {
  braveSearch: (query: string) => Promise<MCPResult>;
  factCheck: (claim: string) => Promise<MCPResult>;
  archiveCheck: (url: string) => Promise<MCPResult>;
  whoisLookup: (domain: string) => Promise<MCPResult>;
}

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  rank: number;
}

export interface FactCheckResult {
  claim: string;
  rating: string;
  publisher: string;
  url: string;
}

export interface ArchiveResult {
  url: string;
  snapshots: Array<{
    timestamp: Date;
    archive_url: string;
  }>;
}

export interface WhoisResult {
  domain: string;
  registrar: string;
  creation_date: Date;
  expiration_date: Date;
  registrant_country?: string;
}
