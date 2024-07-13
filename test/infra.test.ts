import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InfraStack } from '../lib/infra-stack';
import { isValidS3BucketName } from '../lib/utils';

test('S3 Bucket Name Validation', () => {
    const app = new cdk.App();
    const stack = new InfraStack(app, 'EMD-CaseStudy', {
        environment: 'test',
        env: {
            region: 'eu-west-3'
        }
    });
  
    // Synthesize the stack to get the CloudFormation template
    const template = Template.fromStack(stack);
  
    // Find S3 bucket resource(s) in the template
    const bucketResources = template.findResources('AWS::S3::Bucket');
  
    // Only one bucket is expected
    expect(Object.keys(bucketResources).length).toBe(1);

    // Extract the bucket name
    const bucketResourceKey = Object.keys(bucketResources)[0];
    const bucketResource = bucketResources[bucketResourceKey];
    const bucketName = bucketResource.Properties.BucketName;

    console.log(`Validating bucket name: ${bucketName}`);

    // Ensure the generated bucket name is valid
    expect(isValidS3BucketName(bucketName)).toBe(true);
})