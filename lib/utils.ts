import * as cdk from 'aws-cdk-lib';

// Generate an S3 compliant bucket name
export function generateBucketName(stack: cdk.Stack, environment: string): string {
  const timestamp = formatDate(new Date())
  const bucketName = `${environment}-${stack.region}-${timestamp}`;

  return bucketName;
}

// Format a date in YYYY-MM-dd format
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);

  return `${year}-${month}-${day}`
}

// Validate the S3 bucket name
export function isValidS3BucketName(bucketName: string): boolean {
  if (bucketName.length < 3 || bucketName.length > 63) {
      return false;
  }

  const bucketNameRegex = /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/;
  if (!bucketNameRegex.test(bucketName)) {
      return false;
  }

  const ipAddressRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (ipAddressRegex.test(bucketName)) {
      return false;
  }

  return true;
}

export function validateEnvironment(environment: string) {
  // Add other environemnts as needed
  const validEnvironments = [
    'development', 
    'test', 
    'staging',
    'production'];

  if (!validEnvironments.includes(environment)) {
    throw new Error(`Invalid environment: ${environment}. Must be one of ${validEnvironments.join(', ')}`);
  }
}

export function validateRegion(region?: string) {
  // Add other regions as needed
  const validRegions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2', 
    'eu-west-1',
    'eu-west-2',
    'eu-west-3']; 

  if (!(region != null && validRegions.includes(region))) {
    throw new Error(`Invalid region: ${region}. Must be one of ${validRegions.join(', ')}`);
  }
}