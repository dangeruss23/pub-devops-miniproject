import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as path from 'path';
import { generateBucketName, validateEnvironment, validateRegion } from './utils'

interface InfraStackProps extends cdk.StackProps {
  environment: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);
    validateEnvironment(props.environment);
    validateRegion(props.env?.region);

    const environment = props.environment;

    // Create VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create Fargate Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Create ECS Task Definition Template
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, `EMD-TaskDefinition`, {
      family: `EMD-CDK-taskDefinition`,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const containerPort = 56789;
    const albPort = 80;

    fargateTaskDefinition.addContainer('EMD-FargateContainer', {
      containerName: 'EMD-FargateContainer',
      image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../local-image')),
      portMappings: [
          {
              containerPort: containerPort,
              protocol: ecs.Protocol.TCP
          }
      ],
      environment: {
          FAVORITE_DESERT: 'Ice cream',
          PORT: containerPort.toString(),
          NAME: 'EngagedMD'
      },
      logging: new ecs.AwsLogDriver({ streamPrefix: "infra" }),
      readonlyRootFilesystem: true,
      user: "1000"
      },  
    )

    // Create ALB Security Group settings
    const albSecurityGroup = new ec2.SecurityGroup(this, 'EMD-ALBSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from the public Internet
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(albPort),
      'Allow All HTTP traffic'
    );

    // Create ECS task Security Group settings
    const ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'EMD-TaskSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from the load balancer
    ecsTaskSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(containerPort),
      'Allow HTTP traffic from ALB'
    );


    const service = new ecs.FargateService(this, `EMD-FargateService`, {
      assignPublicIp: false,
      cluster: cluster,
      taskDefinition: fargateTaskDefinition,
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [ecsTaskSecurityGroup]
    });

    // Create Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'EMD-ApplicationLoadBalancer', {
      vpc: vpc,
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
    });

    // Add HTTP Listener
    const httpListener = alb.addListener(`EMD-HTTPListener`, {
      port: albPort,
      protocol: ApplicationProtocol.HTTP
    });

    // Add listener target 
    httpListener.addTargets('EMD-Fargate', {
      protocol: ApplicationProtocol.HTTP,
      targets: [service.loadBalancerTarget({
        containerName: 'EMD-FargateContainer',
        containerPort: containerPort
      })],
    });

    // Create an S3 bucket for ALB logs
    const logBucket = new s3.Bucket(this, 'EMD-LogBucket', {
      bucketName: generateBucketName(this, environment),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    });

    // Enable access logging
    alb.logAccessLogs(logBucket);
  }  
}
