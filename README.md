# Welcome to Russell Waltz's CDK case study!

The purpose of this CDK application is to demonstrate my AWS networking, AWS CDK,
Docker, TypeScript, and Python skills.  The following files and folders were modified for the assignment:

* bin/infra.ts: This is the entry point of the application.  It accepts the environment and region as optional command line parameters and instantiates the custom CDK stack.
* lib/infra-stack.ts: This is the custom CDK stack that contains all the resources.  
* local-image: This folder contains the Python application and Dockerfile.

# Deploying the application

## Prerequisites:
* An active AWS account
* The [AWS CDK for Typescript](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) installed

## Deployment Steps

First open a terminal to the root of the project and run npm install to install the dependencies:

`npm install`

Then run this command to transpile the Typescript code to Javascript:

`npm run build`

Then run the unit test to validate that the generated bucket name adheres to AWS naming rules:

`npm run test`

To deploy the app using your default AWS profile, run the following command:

`cdk deploy`

To deploy the app using a named profile, run the following command:

`cdk deploy --profile <your_profile_name>`

The CDK app accepts the following context parameters:

* environment: The environment is used to generate the ALB log bucket name.  The default value is 'development'
* region: The AWS region in which to deploy the application.  This should match the region specified in your AWS profile.  The default value is 'us-east-1'.

Both of these parameters are validated to a list of expected values defined in lib/utils.ts.  Update the valid lists if you need to deploy to an additional environment or region.  To deploy the app using custom values for these parameters, run the following command:

`cdk deploy --context environment=<your_environment> --context region=<your_region>`

# Design Choices

## Networking

* The application load balancer (ALB) is deployed on a public subnet with a public IP and the container is on a private subnet with with a NAT gateway.
* The ALB and ECS task use separate security groups. The container security group only allows traffic that arrives on port 56789 from the ALB security group, while the ALB security group allows HTTP traffic over port 80 from anywhere.
* The application is accessed through the ALB over HTTP on port 80.  The ALB forwards the connection to the container on port 56789.  Both ports are variablized in infra-stack.ts and app.py to minimize the number of lines of code needing to be change if these ports need to be adjusted.
* The container port was left as 56789 because running containers on ports 1024 or higher makes it slightly easier to run the container as a non-root user. Listening on ports lower than 1024 on containers as a non-root user requires adding the NET_BIND_SERVICE capability.

## Security

* The readonlyRootFilesystem property of the Fargate task definition is set to true, which prevents changes being made to files on the running container.  This is a best practice for container security.
* The container runs as a non-root user.  This is another container security best practice.

## Code

* The CDK resource creation code was moved from bin/infra.ts into lib/infra-stack.ts.  This is the intended way for CDK Toolkit generated projects to be structured.  A CDK stack class that provisions all the resources should be generated from a .ts file in the lib folder.  The main entry point to the CDK app should be located in a .ts file in the bin folder, and it should instantiate the class defined in the lib folder.
* The InfraStackProps class was added to explicity pass the environment name into the InfraStack class.  Additional environment specific parameters could be added to this interface in the future to easily deploy multiple copies of the stack with different settings.

## Unit Testing

* The S3 bucket naming validation was implemented as a unit test.  Validating application outputs with unit tests is a best practice because incorrect output is usually caused by incorrect code.  Failed unit tests alert developers to code issues and allow them to be corrected before pushing them to users.  An incorrect bucket name could also be caused by an incorrect environment name being passed in at runtime.  Runtime parameter validation was added to prevent this from happening.

## Configuration

* The NAME environment variable was moved from the Dockerfile into the task definition along with the other environment variables.  The configuration is easier to manage when the variables are all in one place.
* A good future enhancememnt for the region context parameter would be to find a way to pull the region from the AWS profile instead of passing it on the command line.  Passing it on the command line is redundant, but there was not an immediately obvious way to cleanly pull it from the profile.