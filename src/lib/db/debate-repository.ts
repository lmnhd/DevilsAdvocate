import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLE_NAME } from './dynamodb-client';
import { v4 as uuidv4 } from 'uuid';

export interface DebateRecord {
  debateId: string;
  claim: string;
  believerArgument: string;
  skepticArgument: string;
  believerEvidence: EvidenceItem[];
  skepticEvidence: EvidenceItem[];
  verdict: string;
  confidence: number;
  believerStrength?: string;
  skepticStrength?: string;
  riskAssessment?: string;
  createdAt: string;
  updatedAt: string;
  status: 'in_progress' | 'completed';
}

export interface EvidenceItem {
  url: string;
  domain: string;
  snippet: string;
  credibility_score: number;
}

export class DebateRepository {
  /**
   * Create a new debate record
   */
  async createDebate(claim: string): Promise<string> {
    try {
      const debateId = uuidv4();
      const timestamp = new Date().toISOString();

      const item = {
        PK: `DEBATE#${debateId}`,
        SK: 'METADATA',
        debateId,
        claim,
        believerArgument: '',
        skepticArgument: '',
        believerEvidence: [],
        skepticEvidence: [],
        verdict: '',
        confidence: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'in_progress' as const,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      console.log(`[DB] Created debate: ${debateId}`);
      return debateId;
    } catch (error) {
      console.error('[DB] Error creating debate:', error);
      throw error;
    }
  }

  /**
   * Update debate with arguments
   */
  async updateArguments(
    debateId: string,
    believerArgument: string,
    skepticArgument: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      await dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `DEBATE#${debateId}`,
            SK: 'METADATA',
            debateId,
            believerArgument,
            skepticArgument,
            updatedAt: timestamp,
          },
        })
      );

      console.log(`[DB] Updated arguments for debate: ${debateId}`);
    } catch (error) {
      console.error('[DB] Error updating arguments:', error);
      throw error;
    }
  }

  /**
   * Save evidence for a debate
   */
  async saveEvidence(
    debateId: string,
    believerEvidence: EvidenceItem[],
    skepticEvidence: EvidenceItem[]
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      await dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `DEBATE#${debateId}`,
            SK: 'EVIDENCE',
            debateId,
            believerEvidence,
            skepticEvidence,
            updatedAt: timestamp,
          },
        })
      );

      console.log(`[DB] Saved evidence for debate: ${debateId}`);
    } catch (error) {
      console.error('[DB] Error saving evidence:', error);
      throw error;
    }
  }

  /**
   * Save judge verdict
   */
  async saveVerdict(
    debateId: string,
    verdict: string,
    confidence: number,
    believerStrength?: string,
    skepticStrength?: string,
    riskAssessment?: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      await dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `DEBATE#${debateId}`,
            SK: 'VERDICT',
            debateId,
            verdict,
            confidence,
            believerStrength,
            skepticStrength,
            riskAssessment,
            updatedAt: timestamp,
          },
        })
      );

      // Mark debate as completed
      await dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `DEBATE#${debateId}`,
            SK: 'METADATA',
            debateId,
            status: 'completed',
            updatedAt: timestamp,
          },
        })
      );

      console.log(`[DB] Saved verdict for debate: ${debateId}`);
    } catch (error) {
      console.error('[DB] Error saving verdict:', error);
      throw error;
    }
  }

  /**
   * Get complete debate record
   */
  async getDebate(debateId: string): Promise<DebateRecord | null> {
    try {
      const result = await dynamoDb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `DEBATE#${debateId}`,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      // Combine metadata, evidence, and verdict
      const metadata = result.Items.find((item: any) => item.SK === 'METADATA');
      const evidence = result.Items.find((item: any) => item.SK === 'EVIDENCE');
      const verdict = result.Items.find((item: any) => item.SK === 'VERDICT');

      return {
        debateId: metadata?.debateId || '',
        claim: metadata?.claim || '',
        believerArgument: metadata?.believerArgument || '',
        skepticArgument: metadata?.skepticArgument || '',
        believerEvidence: evidence?.believerEvidence || [],
        skepticEvidence: evidence?.skepticEvidence || [],
        verdict: verdict?.verdict || '',
        confidence: verdict?.confidence || 0,
        believerStrength: verdict?.believerStrength,
        skepticStrength: verdict?.skepticStrength,
        riskAssessment: verdict?.riskAssessment,
        createdAt: metadata?.createdAt || '',
        updatedAt: metadata?.updatedAt || '',
        status: metadata?.status || 'in_progress',
      } as DebateRecord;
    } catch (error) {
      console.error('[DB] Error fetching debate:', error);
      throw error;
    }
  }

  /**
   * List recent debates
   */
  async listRecentDebates(limit: number = 20): Promise<DebateRecord[]> {
    try {
      const result = await dynamoDb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'CreatedAtIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'completed',
          },
          ScanIndexForward: false, // Sort descending (newest first)
          Limit: limit,
        })
      );

      // Map to DebateRecord format
      return (result.Items || []).map((item: any) => ({
        debateId: item.debateId,
        claim: item.claim,
        believerArgument: item.believerArgument || '',
        skepticArgument: item.skepticArgument || '',
        believerEvidence: item.believerEvidence || [],
        skepticEvidence: item.skepticEvidence || [],
        verdict: item.verdict || '',
        confidence: item.confidence || 0,
        believerStrength: item.believerStrength,
        skepticStrength: item.skepticStrength,
        riskAssessment: item.riskAssessment,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        status: item.status,
      })) as DebateRecord[];
    } catch (error) {
      console.error('[DB] Error listing debates:', error);
      throw error;
    }
  }
}
