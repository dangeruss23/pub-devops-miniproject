import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';


const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'development';
const region = app.node.tryGetContext('region') || 'us-east-1';

const stack = new InfraStack(app, 'EMD-CaseStudy', { 
    environment, 
    env: { 
      region: region
    } 
  }
);