# Execution Task: Set Up DynamoDB Table for Debate Persistence

## Objective
Configure AWS DynamoDB for storing debate transcripts, evidence sources, and judge verdicts using AWS CDK (Infrastructure as Code).

## Prerequisites Check

Before starting, verify:
- [ ] AWS CLI installed: `aws --version` (should show v2.x+)
- [ ] AWS credentials configured: `aws sts get-caller-identity` (should return your AWS account info)
- [ ] Node.js installed: `node --version` (v18+)
- [ ] AWS CDK installed globally: `npm list -g aws-cdk` (if not: `npm install -g aws-cdk`)

---

## Task 1: Initialize AWS CDK Project (15 minutes)

### Step 1.1: Create CDK Directory Structure

```powershell
# Navigate to project root
cd C:\Users\cclem\Dropbox\Source\Projects-26\DevilsAdvocate

# Create CDK infrastructure directory
mkdir cdk
cd cdk

# Initialize CDK project
cdk init app --language typescript

# Install DynamoDB construct library
npm install @aws-cdk/aws-dynamodb
```

### Step 1.2: Verify CDK Installation

```powershell
# Bootstrap CDK (only needed once per AWS account/region)
cdk bootstrap
```

**Success Criteria**: 
- `cdk` directory created with TypeScript project structure
- `cdk bootstrap` completes without errors

---

## Task 2: Define DynamoDB Table Schema (20 minutes)

### Step 2.1: Design Data Model

**Table Name**: `DevilsAdvocate-Debates`

**Primary Key**:
- `PK` (String) - Partition Key: `DEBATE#{debateId}`
- `SK` (String) - Sort Key: `METADATA` | `EVIDENCE#{evidenceId}` | `VERDICT`

**Access Patterns**:
1. Get debate by ID: Query `PK = DEBATE#{debateId}` and `SK = METADATA`
2. Get all evidence for debate: Query `PK = DEBATE#{debateId}` and `SK begins_with EVIDENCE#`
3. Get verdict for debate: Query `PK = DEBATE#{debateId}` and `SK = VERDICT`
4. List recent debates: Query GSI on `createdAt` timestamp

**Attributes**:
- `debateId` - UUID
- `claim` - String (the claim being debated)
- `believerArgument` - String (full text)
- `skepticArgument` - String (full text)
- `believerEvidence` - List of evidence objects
- `skepticEvidence` - List of evidence objects
- `verdict` - String (Supported/Unsupported/etc.)
- `confidence` - Number (0-100)
- `createdAt` - ISO timestamp
- `updatedAt` - ISO timestamp
- `status` - String (in_progress | completed)

### Step 2.2: Create CDK Stack

**File**: `cdk/lib/cdk-stack.ts`

Replace the default stack content with:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DevilsAdvocateStack extends cdk.Stack {
  public readonly debatesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for debate storage
    this.debatesTable = new dynamodb.Table(this, 'DebatesTable', {
      tableName: 'DevilsAdvocate-Debates',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep table if stack is deleted
      pointInTimeRecovery: true, // Enable backups
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // Enable streams for future features
      
      // Global Secondary Index for querying by timestamp
      globalSecondaryIndexes: [
        {
          indexName: 'CreatedAtIndex',
          partitionKey: {
            name: 'status',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'createdAt',
            type: dynamodb.AttributeType.STRING,
          },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    // Output table name for reference
    new cdk.CfnOutput(this, 'DebatesTableName', {
      value: this.debatesTable.tableName,
      description: 'DynamoDB table name for debates',
      exportName: 'DevilsAdvocateDebatesTable',
    });

    // Output table ARN
    new cdk.CfnOutput(this, 'DebatesTableArn', {
      value: this.debatesTable.tableArn,
      description: 'DynamoDB table ARN',
    });
  }
}
```

### Step 2.3: Update CDK App Entry Point

**File**: `cdk/bin/cdk.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevilsAdvocateStack } from '../lib/cdk-stack';

const app = new cdk.App();

new DevilsAdvocateStack(app, 'DevilsAdvocateStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Devil\'s Advocate - Multi-Agent Debate Platform - DynamoDB Infrastructure',
});
```

---

## Task 3: Deploy DynamoDB Table (10 minutes)

### Step 3.1: Synthesize CloudFormation Template

```powershell
cd cdk

# Generate CloudFormation template (preview)
cdk synth
```

**Verify**: Check that `cdk.out/` directory contains CloudFormation template with DynamoDB table definition.

### Step 3.2: Deploy Stack

```powershell
# Deploy to AWS
cdk deploy

# Confirm deployment when prompted (type 'y')
```

**Success Criteria**:
- Deployment completes successfully
- Console outputs table name and ARN
- Table visible in AWS Console: https://console.aws.amazon.com/dynamodb/

### Step 3.3: Verify Table Creation

```powershell
# List DynamoDB tables
aws dynamodb list-tables

# Describe the table
aws dynamodb describe-table --table-name DevilsAdvocate-Debates
```

**Expected Output**: Table with `PK`, `SK`, and GSI `CreatedAtIndex`

---

## Task 4: Install AWS SDK and Create Database Client (25 minutes)

### Step 4.1: Install Dependencies

```powershell
# Return to project root
cd ..

# Install AWS SDK v3
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### Step 4.2: Create Database Client

**File**: `src/lib/db/dynamodb-client.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Document client for easier data manipulation
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: true, // Convert empty strings to null
  },
  unmarshallOptions: {
    wrapNumbers: false, // Return numbers as numbers, not BigInt
  },
});

export const TABLE_NAME = 'DevilsAdvocate-Debates';
```

### Step 4.3: Create Debate Repository

**File**: `src/lib/db/debate-repository.ts`

```typescript
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
  }

  /**
   * Update debate with arguments
   */
  async updateArguments(
    debateId: string,
    believerArgument: string,
    skepticArgument: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DEBATE#${debateId}`,
          SK: 'METADATA',
          believerArgument,
          skepticArgument,
          updatedAt: timestamp,
        },
      })
    );

    console.log(`[DB] Updated arguments for debate: ${debateId}`);
  }

  /**
   * Save evidence for a debate
   */
  async saveEvidence(
    debateId: string,
    believerEvidence: EvidenceItem[],
    skepticEvidence: EvidenceItem[]
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DEBATE#${debateId}`,
          SK: 'EVIDENCE',
          believerEvidence,
          skepticEvidence,
          updatedAt: timestamp,
        },
      })
    );

    console.log(`[DB] Saved evidence for debate: ${debateId}`);
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
    const timestamp = new Date().toISOString();

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DEBATE#${debateId}`,
          SK: 'VERDICT',
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
          status: 'completed',
          updatedAt: timestamp,
        },
      })
    );

    console.log(`[DB] Saved verdict for debate: ${debateId}`);
  }

  /**
   * Get complete debate record
   */
  async getDebate(debateId: string): Promise<DebateRecord | null> {
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
    const metadata = result.Items.find((item) => item.SK === 'METADATA');
    const evidence = result.Items.find((item) => item.SK === 'EVIDENCE');
    const verdict = result.Items.find((item) => item.SK === 'VERDICT');

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
  }

  /**
   * List recent debates
   */
  async listRecentDebates(limit: number = 20): Promise<DebateRecord[]> {
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
    return (result.Items || []).map((item) => ({
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
  }
}
```

### Step 4.4: Install UUID Library

```powershell
npm install uuid
npm install --save-dev @types/uuid
```

---

## Task 5: Integrate with Streaming API (20 minutes)

### Step 5.1: Update Environment Variables

**File**: `.env.local`

Add:
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

**Security Note**: For production, use IAM roles instead of hardcoded credentials.

### Step 5.2: Modify Streaming Route

**File**: `app/api/debate/stream/route.ts`

Add at the top:
```typescript
import { DebateRepository } from '@/lib/db/debate-repository';
```

Inside the `GET` handler, after creating `tracker`:
```typescript
const tracker = new EvidenceTracker();
const debateRepo = new DebateRepository();

// Create debate record at start
let debateId: string | null = null;
try {
  debateId = await debateRepo.createDebate(claim);
  console.log(`[STREAM] Created debate record: ${debateId}`);
} catch (dbError) {
  console.error('[STREAM] Failed to create debate record:', dbError);
  // Continue without database (graceful degradation)
}
```

When **believer_complete** event fires:
```typescript
if (event.type === 'believer_complete') {
  // ... existing code ...
  
  // Save believer argument to database
  if (debateId) {
    try {
      await debateRepo.updateArguments(debateId, fullContent, '');
    } catch (dbError) {
      console.error('[STREAM] Failed to save believer argument:', dbError);
    }
  }
}
```

When **skeptic_complete** event fires:
```typescript
if (event.type === 'skeptic_complete') {
  // ... existing code ...
  
  // Save skeptic argument to database
  if (debateId) {
    try {
      const metadata = await debateRepo.getDebate(debateId);
      await debateRepo.updateArguments(
        debateId,
        metadata?.believerArgument || '',
        fullContent
      );
    } catch (dbError) {
      console.error('[STREAM] Failed to save skeptic argument:', dbError);
    }
  }
}
```

When **judge_complete** event fires:
```typescript
if (event.type === 'judge_complete') {
  // ... existing verdict parsing code ...
  
  // Save verdict and evidence to database
  if (debateId) {
    try {
      // Save evidence
      const believerEv = tracker.getEvidenceByRole('believer');
      const skepticEv = tracker.getEvidenceByRole('skeptic');
      
      await debateRepo.saveEvidence(
        debateId,
        believerEv.map(e => ({
          url: e.url,
          domain: e.domain,
          snippet: e.snippet,
          credibility_score: e.credibility_score,
        })),
        skepticEv.map(e => ({
          url: e.url,
          domain: e.domain,
          snippet: e.snippet,
          credibility_score: e.credibility_score,
        }))
      );
      
      // Save verdict
      await debateRepo.saveVerdict(
        debateId,
        verdictMatch?.[1]?.trim() || 'Unable to determine verdict',
        confidence,
        believerMatch?.[1],
        skepticMatch?.[1],
        riskAssessment
      );
      
      console.log(`[STREAM] ✓ Saved complete debate to DynamoDB: ${debateId}`);
    } catch (dbError) {
      console.error('[STREAM] Failed to save verdict:', dbError);
    }
  }
}
```

---

## Task 6: Create API Endpoint for Fetching Past Debates (15 minutes)

**File**: `app/api/debates/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { DebateRepository } from '@/lib/db/debate-repository';

export const runtime = 'edge';

/**
 * GET /api/debates - List recent debates
 */
export async function GET() {
  try {
    const repo = new DebateRepository();
    const debates = await repo.listRecentDebates(20);
    
    return NextResponse.json({
      success: true,
      count: debates.length,
      debates,
    });
  } catch (error) {
    console.error('[API] Failed to fetch debates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debates' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/debates/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DebateRepository } from '@/lib/db/debate-repository';

export const runtime = 'edge';

/**
 * GET /api/debates/:id - Get specific debate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repo = new DebateRepository();
    const debate = await repo.getDebate(params.id);
    
    if (!debate) {
      return NextResponse.json(
        { success: false, error: 'Debate not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      debate,
    });
  } catch (error) {
    console.error('[API] Failed to fetch debate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debate' },
      { status: 500 }
    );
  }
}
```

---

## Task 7: Test Database Integration (10 minutes)

### Step 7.1: Run a Debate

```powershell
npm run dev
```

Navigate to `http://localhost:3000` and run a complete debate.

### Step 7.2: Verify Data in DynamoDB

```powershell
# Scan table to see all items
aws dynamodb scan --table-name DevilsAdvocate-Debates --max-items 5
```

### Step 7.3: Test API Endpoints

```powershell
# List recent debates
curl http://localhost:3000/api/debates

# Get specific debate (replace {id} with actual debate ID from logs)
curl http://localhost:3000/api/debates/{id}
```

---

## Success Criteria

- [ ] DynamoDB table deployed in AWS
- [ ] Table has correct schema (PK, SK, GSI)
- [ ] Debate repository code created
- [ ] Streaming API saves debates to DynamoDB
- [ ] API endpoints return saved debates
- [ ] Console logs show successful database operations
- [ ] AWS Console shows debate records in DynamoDB table

---

## Troubleshooting

**Error: "Credentials not found"**
- Run: `aws configure`
- Enter Access Key ID and Secret Access Key
- Set region to `us-east-1`

**Error: "Table already exists"**
- Either delete existing table: `aws dynamodb delete-table --table-name DevilsAdvocate-Debates`
- Or change table name in `cdk/lib/cdk-stack.ts`

**Error: "Edge runtime doesn't support AWS SDK"**
- Change `export const runtime = 'edge';` to `export const runtime = 'nodejs';` in API routes that use DynamoDB
- Edge runtime has limitations with native AWS SDK

**Error: "Cannot find module '@aws-sdk/client-dynamodb'"**
- Run: `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`

---

## Estimated Time: 115 minutes total
- Task 1: CDK Setup (15 min)
- Task 2: Schema Design (20 min)
- Task 3: Deployment (10 min)
- Task 4: Database Client (25 min)
- Task 5: API Integration (20 min)
- Task 6: API Endpoints (15 min)
- Task 7: Testing (10 min)

---

## Next Steps After Completion

1. **Add Debate History UI** - Create page to browse past debates
2. **Add Search Functionality** - Query debates by claim text
3. **Add Analytics** - Track most debated topics, verdict distribution
4. **Implement Caching** - Cache frequently accessed debates
5. **Set up CloudWatch Alarms** - Monitor DynamoDB usage and errors
