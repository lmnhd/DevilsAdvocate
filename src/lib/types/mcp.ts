/**
 * Model Context Protocol (MCP) Type Definitions
 * Types for MCP integration with verification tools
 */

/**
 * Configuration for verification tools via MCP
 */
export interface VerificationTools {
  braveSearch: BraveSearchConfig;
  googleFactCheck: GoogleFactCheckConfig;
  customTools?: CustomToolConfig[];
}

/**
 * Brave Search API configuration
 */
export interface BraveSearchConfig {
  apiKey: string;
  endpoint: string;
  maxResults: number;
  safeSearch: boolean;
  freshness?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Google Fact Check API configuration
 */
export interface GoogleFactCheckConfig {
  apiKey: string;
  endpoint: string;
  languageCode: string;
  maxResults: number;
}

/**
 * Custom tool configuration
 */
export interface CustomToolConfig {
  name: string;
  description: string;
  endpoint: string;
  apiKey?: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
}

/**
 * Search result from Brave Search
 */
export interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
  type: 'web' | 'news' | 'video';
  thumbnail?: string;
  extra_snippets?: string[];
}

/**
 * Brave Search API response
 */
export interface BraveSearchResponse {
  query: string;
  results: SearchResult[];
  news?: NewsResult[];
  infobox?: InfoboxResult;
  mixed?: MixedResult[];
}

/**
 * News search result
 */
export interface NewsResult {
  title: string;
  url: string;
  description: string;
  age: string;
  source: string;
  thumbnail?: string;
}

/**
 * Infobox result
 */
export interface InfoboxResult {
  title: string;
  description: string;
  url?: string;
  thumbnail?: string;
  attributes?: Record<string, string>;
}

/**
 * Mixed search result
 */
export interface MixedResult {
  type: string;
  index: number;
  all: boolean;
}

/**
 * Fact check result from Google Fact Check API
 */
export interface FactCheckResult {
  claim: string;
  claimant?: string;
  claimDate?: string;
  claimReview: ClaimReview[];
  languageCode: string;
}

/**
 * Claim review details
 */
export interface ClaimReview {
  publisher: Publisher;
  url: string;
  title: string;
  reviewDate: string;
  textualRating: string;
  languageCode: string;
}

/**
 * Publisher information
 */
export interface Publisher {
  name: string;
  site: string;
}

/**
 * Google Fact Check API response
 */
export interface GoogleFactCheckResponse {
  claims: FactCheckResult[];
  nextPageToken?: string;
}

/**
 * MCP tool invocation request
 */
export interface MCPToolRequest {
  tool: 'brave-search' | 'google-fact-check' | 'custom';
  parameters: Record<string, unknown>;
  timeout?: number;
}

/**
 * MCP tool invocation response
 */
export interface MCPToolResponse<T = unknown> {
  tool: string;
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata: MCPResponseMetadata;
}

/**
 * MCP error details
 */
export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Metadata about MCP tool response
 */
export interface MCPResponseMetadata {
  duration: number; // milliseconds
  timestamp: Date;
  retries: number;
  cached: boolean;
}
