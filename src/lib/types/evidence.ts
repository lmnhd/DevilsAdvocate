/**
 * Evidence and Verification Type Definitions
 * Types for source verification and credibility scoring
 */

export type VerificationStatus = 
  | 'verified' 
  | 'unverified' 
  | 'disputed' 
  | 'failed' 
  | 'pending';

export type SourceType = 
  | 'academic' 
  | 'news' 
  | 'government' 
  | 'organization' 
  | 'social-media' 
  | 'blog' 
  | 'unknown';

/**
 * Evidence source with verification details
 */
export interface EvidenceSource {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishDate?: string;
  type: SourceType;
  content: string;
  excerpt: string;
  verification: VerificationResult;
  credibility: CredibilityScore;
  metadata: SourceMetadata;
}

/**
 * Result of source verification
 */
export interface VerificationResult {
  status: VerificationStatus;
  method: string; // e.g., 'google-fact-check', 'brave-search', 'manual'
  confidence: number; // 0-1
  verifiedAt: Date;
  verifiedBy: string;
  flags: VerificationFlag[];
  notes?: string;
}

/**
 * Flags raised during verification
 */
export interface VerificationFlag {
  type: 'bias' | 'outdated' | 'unverifiable' | 'conflict' | 'suspicious';
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence?: string;
}

/**
 * Credibility score with breakdown
 */
export interface CredibilityScore {
  overall: number; // 0-1
  factors: CredibilityFactors;
  explanation: string;
  lastUpdated: Date;
}

/**
 * Factors contributing to credibility
 */
export interface CredibilityFactors {
  sourceReputation: number; // 0-1
  authorCredibility: number; // 0-1
  contentQuality: number; // 0-1
  factCheckAlignment: number; // 0-1
  recency: number; // 0-1
  citationCount?: number;
  peerReviewed?: boolean;
}

/**
 * Metadata about the source
 */
export interface SourceMetadata {
  domain: string;
  fetchedAt: Date;
  language: string;
  wordCount: number;
  hasPaywall: boolean;
  requiresLogin: boolean;
  contentHash: string; // for deduplication
}
