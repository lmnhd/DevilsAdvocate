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
