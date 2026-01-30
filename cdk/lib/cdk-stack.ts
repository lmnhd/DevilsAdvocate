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
    });

    // Global Secondary Index for querying by timestamp
    this.debatesTable.addGlobalSecondaryIndex({
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
